import { BBSPlusCredential as Credential } from "@docknetwork/crypto-wasm-ts";
import Box from "@mui/material/Box";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeView from "@mui/lab/TreeView";
import TreeItem from "@mui/lab/TreeItem";
import { countries as allCountries, type TCountryCode } from "countries-list";

interface CommunityFormFilledProps {
    communityCredential: Credential;
}

function getJSXFromCredential(typeSpecific: object) {
    const typeSpecificAttrs = Object.entries(typeSpecific);
    return (
        <TreeView
            aria-label="file system navigator"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            defaultExpanded={["countries"]}
        >
            {typeSpecificAttrs.map(([key, value]) => {
                if (typeof value === "object") {
                    if (key === "countries") {
                        const newValue = Object.keys(value)
                            .filter(
                                (countryCode) => value[countryCode] === true
                            )
                            .map(
                                (countryCode) =>
                                    allCountries[countryCode as TCountryCode]
                                        .name
                            );
                        return (
                            <TreeItem
                                defaultChecked={true}
                                nodeId={key}
                                label={key}
                            >
                                {newValue.join(", ")}
                            </TreeItem>
                        );
                    }
                    return (
                        <TreeItem nodeId={key} label={`${key}`}>
                            {getTreeViewsFromObj(value)}
                        </TreeItem>
                    );
                } else {
                    return (
                        <TreeItem
                            nodeId={key}
                            label={`${key}: ${value}`}
                        ></TreeItem>
                    );
                }
            })}
        </TreeView>
    );
}

function getTreeViewsFromObj(obj: object) {
    const objEntries = Object.entries(obj);
    {
        return objEntries.map(([key, value], _index) => {
            if (typeof value === "object") {
                return (
                    <TreeItem nodeId={key} label={`${key}`}>
                        {getTreeViewsFromObj(value)}
                    </TreeItem>
                );
            } else {
                return (
                    <TreeItem
                        nodeId={key}
                        label={`${key}: ${value}`}
                    ></TreeItem>
                );
            }
        });
    }
}

export function CommunityFormFilled({
    communityCredential,
}: CommunityFormFilledProps) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
            }}
        >
            <Box sx={{ mt: 2 }}>
                <Accordion defaultExpanded={true}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography>Your self-attested attributes</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {(communityCredential.subject as any)?.typeSpecific !==
                        undefined
                            ? getJSXFromCredential(
                                  (communityCredential.subject as any)
                                      ?.typeSpecific
                              )
                            : null}
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    );
}

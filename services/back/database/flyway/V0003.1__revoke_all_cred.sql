update credential_form set is_revoked=true where pk_version=1;
update credential_email set is_revoked=true where pk_version=1;
update credential_secret set is_revoked=true where pk_version=1;

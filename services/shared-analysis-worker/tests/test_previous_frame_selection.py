from collections.abc import Iterator
from datetime import UTC, datetime

import pytest
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from agora_analysis_worker_shared.db import fetch_previous_selected_view_snapshots_by_pair
from agora_analysis_worker_shared.generated_models import (
    AnalysisResultOutcomeEnum,
    AnalysisSnapshotResult,
    Base,
    ConversationViewSnapshot,
    ConversationViewSnapshotCheckpointReason,
    ConversationViewSnapshotCheckpointReasonEnum,
    ConversationViewSnapshotReasonEnum,
    OpinionGroupCandidate,
    OpinionGroupCandidateAssessment,
    OpinionGroupVariant,
)

NOW = datetime(2026, 10, 21, tzinfo=UTC)


@pytest.fixture
def engine() -> Iterator[Engine]:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    try:
        yield engine
    finally:
        engine.dispose()


def add_frame(
    session: Session,
    *,
    frame_id: int,
    spec_id: int = 1,
    activated: bool = True,
    checkpoint: bool = False,
    successful: bool = True,
    closed: bool = False,
) -> None:
    session.add(
        ConversationViewSnapshot(
            id=frame_id,
            conversation_id=10,
            opinion_group_spec_id=spec_id,
            analysis_snapshot_id=frame_id,
            view_reason=ConversationViewSnapshotReasonEnum.analysis_completed,
            is_closed=closed,
            opinion_count=2,
            vote_count=10,
            participant_count=5,
            total_opinion_count=2,
            total_vote_count=10,
            total_participant_count=5,
            moderated_opinion_count=0,
            hidden_opinion_count=0,
            created_at=NOW,
            activated_at=NOW if activated else None,
        )
    )
    session.add(
        AnalysisSnapshotResult(
            id=frame_id,
            conversation_id=10,
            analysis_snapshot_id=frame_id,
            opinion_group_spec_id=spec_id,
            outcome=AnalysisResultOutcomeEnum.success,
            created_at=NOW,
        )
    )
    for group_count in (2, 3):
        candidate_id = frame_id * 10 + group_count
        session.add_all(
            [
                OpinionGroupVariant(
                    id=candidate_id,
                    opinion_group_spec_id=spec_id,
                    group_count=group_count,
                    created_at=NOW,
                ),
                OpinionGroupCandidate(
                    id=candidate_id,
                    snapshot_result_id=frame_id,
                    opinion_group_variant_id=candidate_id,
                    scope_id=1,
                    outcome=AnalysisResultOutcomeEnum.success
                    if successful
                    else AnalysisResultOutcomeEnum.insufficient_data,
                    created_at=NOW,
                ),
                OpinionGroupCandidateAssessment(
                    candidate_id=candidate_id,
                    selection_score=0.9 if group_count == 3 else 0.4,
                    created_at=NOW,
                ),
            ]
        )
    if checkpoint:
        session.add(
            ConversationViewSnapshotCheckpointReason(
                conversation_view_snapshot_id=frame_id,
                conversation_id=10,
                opinion_group_spec_id=spec_id,
                reason=ConversationViewSnapshotCheckpointReasonEnum.first_displayable_analysis,
                created_at=NOW,
            )
        )
    session.flush()


def test_selects_all_candidates_from_the_latest_eligible_frame_per_spec(engine: Engine) -> None:
    with Session(engine) as session:
        add_frame(session, frame_id=1)
        add_frame(session, frame_id=2, closed=True)
        add_frame(session, frame_id=3, activated=False)
        add_frame(session, frame_id=4, successful=False)
        add_frame(session, frame_id=5)
        add_frame(session, frame_id=6, spec_id=2)
        previous = fetch_previous_selected_view_snapshots_by_pair(
            session,
            pairs=[(10, 1), (10, 2), (10, 3)],
            current_view_snapshot_ids=[5],
        )
        assert set(previous) == {(10, 1), (10, 2)}
        assert previous[(10, 1)].group_count == 3
        assert previous[(10, 1)].is_closed is True
        assert previous[(10, 2)].group_count == 3
        assert previous[(10, 2)].is_closed is False


def test_checkpoint_selection_skips_more_recent_non_checkpoint_frames(engine: Engine) -> None:
    with Session(engine) as session:
        add_frame(session, frame_id=1, checkpoint=True, closed=True)
        add_frame(session, frame_id=2)
        previous = fetch_previous_selected_view_snapshots_by_pair(
            session,
            pairs=[(10, 1)],
            current_view_snapshot_ids=[],
            checkpoint_only=True,
        )
        assert previous[(10, 1)].is_closed is True

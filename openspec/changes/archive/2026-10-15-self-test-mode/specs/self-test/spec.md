## ADDED Requirements

### Requirement: Self-test run is built from the pack's Thailand doors

The system SHALL build a self-test run of up to 10 single-answer questions using Thailand's question builder (`thailandQuestion` → `setupThailandRound`) with the challenge levels of the pack's enabled Thailand Doors, cycling through them in ladder order. Rounds that cannot be built SHALL be dropped. No prompt item SHALL repeat within a run when the pack has enough content.

#### Scenario: yue run
- **GIVEN** the real yue pack
- **WHEN** a run is built
- **THEN** it has 10 questions, each with 4 distinct choices and a valid correct index, drawn from at least 3 different ref/choice pairings, with no repeated prompt

#### Scenario: pack without Thailand doors
- **GIVEN** a pack with no enabled Thailand door
- **WHEN** a run is built
- **THEN** it is empty and the menu shows no self-test entry

### Requirement: One answer per question, score at the end

Each question SHALL accept exactly one answer (the first tap), reveal the correct choice, then advance. After the last question the screen SHALL show "End of test", the score as `correct / total`, a Try again action (new run) and a Back to menu action.

#### Scenario: score
- **GIVEN** a 10-question run
- **WHEN** 8 answers match the correct choice
- **THEN** the end screen shows 8 / 10

### Requirement: Self-test is ungraded and unrecorded

The self-test SHALL NOT write points, trackers, round cursors or any progress entry, and SHALL NOT send analytics. It is not a Door and SHALL NOT change ladder order or the next-door search.

#### Scenario: no writes
- **WHEN** the self-test lib's source is inspected
- **THEN** it imports none of `@alphaTiles/data-progress`, `@alphaTiles/data-door-progress`, `@shared/util-analytics`

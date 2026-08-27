const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDENTIFIER_RE = /^([A-Z][A-Z0-9]{0,9})-(\d+)$/;

export type IssueRef =
  | { kind: 'id'; id: string }
  | { kind: 'identifier'; teamKey: string; number: number };

export function parseIssueRef(raw: string): IssueRef | null {
  const value = raw.trim();
  if (!value) return null;
  if (UUID_RE.test(value)) {
    return { kind: 'id', id: value.toLowerCase() };
  }
  const match = IDENTIFIER_RE.exec(value.toUpperCase());
  if (!match) return null;
  return {
    kind: 'identifier',
    teamKey: match[1]!,
    number: Number(match[2]),
  };
}

export function issueIdentifier(teamKey: string, number: number): string {
  return `${teamKey}-${number}`;
}

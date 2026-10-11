import type { PaletteIssue } from './types';


export class PaletteConfigError extends Error {
    public readonly issues: PaletteIssue[];

    public constructor(issues: PaletteIssue[]) {
        super(formatIssues(issues));
        this.name = 'PaletteConfigError';
        this.issues = issues;
    }
}


function formatIssues(issues: readonly PaletteIssue[]): string {
    const lines: string[] = issues.map((issue: PaletteIssue): string => `  ${issue.path}: ${issue.message}`);

    return ['Invalid palette config:', ...lines].join('\n');
}

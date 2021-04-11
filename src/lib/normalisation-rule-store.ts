import WorkspaceAdaptor from './adaptors/workspace';
import {LoadedNormalisationRule, SavedNormalisationRule} from './types/normalisation-rule';
const isEqual = require('lodash.isequal');
const omit = require('lodash.omit');

const clone = (value: any) => JSON.parse(JSON.stringify(value));

export default class NormalisationRuleStore {
    private baseRules?: SavedNormalisationRule[];
    private rules?: LoadedNormalisationRule[];

    constructor(private readonly workspace: WorkspaceAdaptor) {
        this.setupRules(this.workspace.get<SavedNormalisationRule[]>('preComparisonTextNormalizationRules'));
    }

    private setupRules(rules: SavedNormalisationRule[]): void {
        this.baseRules = clone(rules);
        this.rules = this.resetRuleStatus(this.baseRules!);
    }

    private resetRuleStatus(rules: SavedNormalisationRule[]): LoadedNormalisationRule[] {
        return rules.map(rule =>
            Object.assign({}, omit(rule, ['enableOnStart']), {
                active: rule.enableOnStart !== false
            })
        );
    }

    getAllRules(): LoadedNormalisationRule[] {
        const newBaseRules = this.workspace.get<SavedNormalisationRule[]>('preComparisonTextNormalizationRules');
        if (!isEqual(newBaseRules, this.baseRules)) {
            this.setupRules(newBaseRules);
        }
        return this.rules!;
    }

    get activeRules(): LoadedNormalisationRule[] {
        return this.getAllRules().filter(rule => rule.active);
    }

    get hasActiveRules(): boolean {
        return this.activeRules.length > 0;
    }

    specifyActiveRules(ruleIndices: number[]): void {
        this.rules = this.rules!.map((rule, index) =>
            Object.assign({}, rule, {active: ruleIndices.includes(index)})
        );
    }
}

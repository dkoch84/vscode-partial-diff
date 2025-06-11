import Bootstrapper from './bootstrapper';
import CommandFactory from './command-factory';
import WorkspaceAdaptor from './adaptors/workspace';
import ContentProvider from './content-provider';
import NormalisationRuleStore from './normalisation-rule-store';
import SelectionInfoRegistry from './selection-info-registry';
import * as vscode from 'vscode';
import CommandAdaptor from './adaptors/command';
import WindowAdaptor from './adaptors/window';
import {NullVsTelemetryReporter, VsTelemetryReporterCreator} from './telemetry-reporter';
import VsTelemetryReporter from '@vscode/extension-telemetry';

export default class BootstrapperFactory {
    private workspaceAdaptor?: WorkspaceAdaptor;

    create() {
        const logger = console;
        const selectionInfoRegistry = new SelectionInfoRegistry();
        const workspaceAdaptor = this.getWorkspaceAdaptor();
        const commandAdaptor = new CommandAdaptor(vscode.commands, vscode.Uri.parse, logger);
        const normalisationRuleStore = new NormalisationRuleStore(workspaceAdaptor);
        const commandFactory = new CommandFactory(
            selectionInfoRegistry,
            normalisationRuleStore,
            commandAdaptor,
            new WindowAdaptor(vscode.window),
            vscode.env.clipboard,
            () => new Date()
        );
        const contentProvider = new ContentProvider(selectionInfoRegistry, normalisationRuleStore);
        return new Bootstrapper(commandFactory, contentProvider, workspaceAdaptor, commandAdaptor);
    }

    private getWorkspaceAdaptor() {
        this.workspaceAdaptor = this.workspaceAdaptor || new WorkspaceAdaptor(vscode.workspace);
        return this.workspaceAdaptor;
    }

    getVsTelemetryReporterCreator(): VsTelemetryReporterCreator {
        const enableTelemetry = this.getWorkspaceAdaptor().get<boolean>('enableTelemetry');
        if (enableTelemetry) {
            return (_id: string, _version: string, telemetryKey: string) => {
                // For the new telemetry API, we use a connection string format
                // The telemetryKey is an Application Insights instrumentation key
                const connectionString = `InstrumentationKey=${telemetryKey}`;
                return new VsTelemetryReporter(connectionString);
            };
        } else {
            return () => new NullVsTelemetryReporter();
        }
    }
}

import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { asWindowsPath, experimental, normalize } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import os from 'os';
import * as path from 'path';
import * as engine from '../engine/engine';
import deploy from './actions';
import { Schema } from './schema';

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder<any>(
  async (options: Schema, context: BuilderContext): Promise<BuilderOutput> => {
    // The project root is added to a BuilderContext.
    const root = normalize(context.workspaceRoot);
    const workspace = new experimental.workspace.Workspace(
      root,
      new NodeJsSyncHost()
    );

    await workspace.loadWorkspaceFromHost(normalize('angular.json')).toPromise();

    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    const targets = workspace.getProjectTargets(context.target.project);

    const outputPath = await getLibraryOutputPath(targets);

    // normalizes pathes don't work with all native functions
    // as a workaround, you can use the following 2 lines
    const isWin = os.platform() === 'win32';
    const workspaceRoot = !isWin ? workspace.root : asWindowsPath(workspace.root);
    // if this is not necessary, use this:
    // const workspaceRoot =  workspace.root;

    try {
      await deploy(
        engine,
        context,
        path.join(workspaceRoot, outputPath),
        options
      );
    } catch (e) {
      context.logger.error('Error when trying to deploy:', e);
      console.error(e);
      return { success: false };
    }

    return { success: true };
  }
);

const fs = require('fs');
function readFileAsync<T>(path: string): Promise<T> {
  return new Promise((res, rej) => {
    fs.readFile(path, 'utf8', function (err, contents) {
      if (err) rej(err);
      res(contents);
    });
  });
}

async function getLibraryOutputPath(targets: experimental.workspace.WorkspaceTool) {
  const ngPackagePath = targets.build.options.project;

  try {
    const dataStr = await readFileAsync<string>(ngPackagePath);
    const data = JSON.parse(dataStr);

    const fullPath = (data.dest as string).replace(/\.\.\//g, '');

    return fullPath;
  } catch (err) {
    throw new Error('An error occurs reading the ng-package.json');
  }
}

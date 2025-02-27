import { JsonObject, logging } from '@angular-devkit/core';
import {
  BuilderContext,
  BuilderRun,
  ScheduleOptions,
  Target
} from '@angular-devkit/architect/src/index';
import deploy from './actions';

let context: BuilderContext;
const mockEngine = { run: (_: string, __: any, __2: any) => Promise.resolve() };

const PROJECT = 'pirojok-project';

describe('Deploy Angular apps', () => {
  beforeEach(() => initMocks());

  describe('Builder', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(context, 'scheduleTarget');
    });

    it('should invoke the builder', async () => {
      await deploy(mockEngine, context, 'host', {});

      expect(spy).toHaveBeenCalledWith({
        target: 'build',
        project: PROJECT
      });
    });

    it('should invoke the builder with the right configuration', async () => {
      const customConf = 'my-custom-conf';

      await deploy(mockEngine, context, 'host', {
        configuration: customConf
      });

      expect(spy).toHaveBeenCalledWith({
        target: 'build',
        project: PROJECT,
        configuration: customConf
      });
    });
  });

  it('should invoke engine.run', async () => {
    const spy = spyOn(mockEngine, 'run').and.callThrough();
    await deploy(mockEngine, context, 'host', {});

    expect(spy).toHaveBeenCalledWith('host', {}, context.logger);
  });

  describe('error handling', () => {
    it('throws if there is no target project', async () => {
      context.target = undefined;
      try {
        await deploy(mockEngine, context, 'host', {});
        fail();
      } catch (e) {
        expect(e.message).toMatch(/Cannot execute the build target/);
      }
    });
  });
});

const initMocks = () => {
  context = {
    target: {
      configuration: 'production',
      project: PROJECT,
      target: 'foo'
    },
    builder: {
      builderName: 'mock',
      description: 'mock',
      optionSchema: false
    },
    currentDirectory: 'cwd',
    id: 1,
    logger: new logging.NullLogger() as any,
    workspaceRoot: 'cwd',
    addTeardown: _ => {},
    validateOptions: _ => Promise.resolve({} as any),
    getBuilderNameForTarget: () => Promise.resolve(''),
    analytics: null as any,
    getTargetOptions: (_: Target) => Promise.resolve({}),
    reportProgress: (_: number, __?: number, ___?: string) => {},
    reportStatus: (_: string) => {},
    reportRunning: () => {},
    scheduleBuilder: (_: string, __?: JsonObject, ___?: ScheduleOptions) =>
      Promise.resolve({} as BuilderRun),
    scheduleTarget: (_: Target, __?: JsonObject, ___?: ScheduleOptions) =>
      Promise.resolve({} as BuilderRun)
  };
};

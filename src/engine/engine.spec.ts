import { BuilderContext } from '@angular-devkit/architect';
import { Schema } from '../deploy/schema';
import { logging } from '../__mocks__/utils/dev-kit-logger';
import { npmAccess } from './defaults';
import * as engine from './engine';
import * as execAsync from './utils/exec-async';

jest.mock('./utils/exec-async');
let context: BuilderContext;

describe('engine', () => {
  describe('getOptionsString', () => {
    let options: Object;
    let expectedCmdStringOptions: string;

    beforeEach(() => {
      options = {
        justAnExample: 'example',
        anotherExample: 'example',
        hello: 'hallo',
        justAnUndefined: undefined
      };

      expectedCmdStringOptions =
        '--just-an-example example --another-example example --hello hallo';
    });

    it('should transform the camelCase options to CMD options', () => {
      const transformedOptions = engine.getOptionsString(options);

      expect(transformedOptions).toEqual(expectedCmdStringOptions);
    });
  });

  describe('prepareOptions', () => {
    let options: Schema;
    let expectedOptions: Schema;

    it('should overwrite the default option dry-run', () => {
      const options = {
        otp: 'random-text',
        dryRun: true,
        tag: 'random-tag'
      };
      const expectedOptions = {
        otp: 'random-text',
        dryRun: true,
        tag: 'random-tag',
        access: npmAccess.public
      };

      const processedOptions = engine.prepareOptions(options, logging);

      expect(processedOptions).toEqual(expectedOptions);
    });

    it('should overwrite the default option dry-run and access', () => {
      const options = {
        otp: 'random-text',
        dryRun: true,
        tag: 'random-tag',
        access: npmAccess.restricted
      };
      const expectedOptions = {
        otp: 'random-text',
        dryRun: true,
        tag: 'random-tag',
        access: npmAccess.restricted
      };

      const processedOptions = engine.prepareOptions(options, logging);

      expect(processedOptions).toEqual(expectedOptions);
    });
  });

  describe('run', () => {
    let customOptions: Object;
    let customOptionsCMD: string;
    let dir: string;

    //Spyes
    let prepareOptionsSpy: jest.SpyInstance;
    let getOptionsStringSpy: jest.SpyInstance;

    beforeEach(() => {
      customOptions = {
        customOptions: 'random'
      };
      customOptionsCMD = '--custom-options random';
      dir = 'customDir';

      prepareOptionsSpy = jest
        .spyOn(engine, 'getOptionsString')
        .mockReturnValue('');
      getOptionsStringSpy = jest
        .spyOn(engine, 'getOptionsString')
        .mockReturnValue(customOptionsCMD);
    });

    afterEach(function () {
      jest.clearAllMocks();
    });

    it('should execute the command correctly', (done: () => void) => {
      engine
        .run(dir, customOptions, context)
        .then(() => {
          expect(execAsync.default).toHaveBeenCalledWith(
            `npm publish ${dir} ${customOptionsCMD}`
          );
          done();
        })
        .catch(err => fail('should be completed' + err));

      (execAsync as any).resolve('npm output');
    });

    it('should throw an error if the command fail', (done: () => void) => {
      const customErr = 'custom err';

      engine
        .run(dir, customOptions, context)
        .then(() => fail('should enter in the catch section'))
        .catch(err => {
          expect(customErr).toEqual(err);
          done();
        });

      (execAsync as any).reject(customErr);
    });
  });
});

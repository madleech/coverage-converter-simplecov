const fs = require('fs');
const glob = require('glob');
const core = require('@actions/core');
const logic = require('../logic');

// Mock the core module
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn()
}));

// Mock the fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock the glob module
jest.mock('glob', () => ({
  sync: jest.fn()
}));

describe('simplecov-converter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('expand', () => {
    it('should return matching files', () => {
      const mockFiles = ['coverage1.json', 'coverage2.json'];
      glob.sync.mockReturnValue(mockFiles);

      const result = logic.expand('*.json');
      expect(result).toEqual(mockFiles);
      expect(glob.sync).toHaveBeenCalledWith('*.json');
    });

    it('should throw error when no files found', () => {
      glob.sync.mockReturnValue([]);
      expect(() => logic.expand('*.json')).toThrow('No coverage files found matching pattern: *.json');
    });
  });

  describe('read', () => {
    it('should read and parse JSON files', () => {
      const mockFiles = ['file1.json', 'file2.json'];
      const mockContents = [
        { coverage: { 'file1.rb': { lines: [1, 1, 1] } } },
        { coverage: { 'file2.rb': { lines: [1, 0, 1] } } }
      ];

      fs.readFileSync
        .mockReturnValueOnce(JSON.stringify(mockContents[0]))
        .mockReturnValueOnce(JSON.stringify(mockContents[1]));

      const result = logic.read(mockFiles);
      expect(result).toEqual(mockContents);
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('merge', () => {
    it('should merge coverage data from multiple files', () => {
      const inputs = [
        {
          'Browser': {
            coverage: {
              'file1.rb': { lines: [1, 1, 0] },
            }
          },
          'CI': {
            coverage: {
              'file2.rb': { lines: [1, 0, 1 ] }
            }
          }
        },
        {
          'RSpec': {
            coverage: {
              'file1.rb': { lines: [1, 1, 1] },
              'file3.rb': { lines: [1, 1, 0] }
            }
          }
        }
      ];

      const expected = {
        'file1.rb': [1, 1, 1],
        'file2.rb': [1, 0, 1],
        'file3.rb': [1, 1, 0]
      };

      const result = logic.merge(inputs);
      expect(result).toEqual(expected);
    });
  });

  describe('removePrefixes', () => {
    it('should remove common prefix from filenames', () => {
      const input = {
        '/foo/bar.js': [1, 2, 3],
        '/foo/foo/asdf.js': [2, 3, 4]
      };

      const expected = {
        '/bar.js': [1, 2, 3],
        '/foo/asdf.js': [2, 3, 4]
      }

      const result = logic.removePrefixes(input, '/foo');
      expect(result).toEqual(expected);
    });

    it('should no change input when prefix is not provided', () => {
      const input = {
        '/foo/bar.js': [1, 2, 3],
        '/foo/foo/asdf.js': [2, 3, 4]
      };

      const expected = input;

      const result = logic.removePrefixes(input, '');
      expect(result).toEqual(expected);
    })
  });

  describe('run', () => {
    it('should process coverage files successfully', () => {
      const mockPattern = '**/.resultset.json';
      const mockFiles = ['coverage/.resultset.json'];
      const mockContent = { "RSpec": { coverage: { 'file.rb': { lines: [1, 1, 1] } } } };

      core.getInput.mockReturnValue(mockPattern);
      glob.sync.mockReturnValue(mockFiles);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockContent));

      logic.run();

      expect(core.getInput).toHaveBeenCalledWith('coverage-file');
      expect(glob.sync).toHaveBeenCalledWith(mockPattern);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockFiles[0], 'utf8');
      expect(core.setOutput).toHaveBeenCalled();
    });

    it('should handle errors', () => {
      const error = new Error('Test error');
      core.getInput.mockImplementation(() => { throw error; });

      logic.run();

      expect(core.setFailed).toHaveBeenCalledWith(error.message);
    });
  });
});

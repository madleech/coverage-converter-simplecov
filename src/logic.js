const core = require('@actions/core');
const fs = require('fs');
const glob = require('glob');

function run() {
  try {
    const pattern = core.getInput("coverage-file");
    core.info(`Coverage file pattern: ${pattern}`);

    const files = expand(pattern);
    core.info(`Coverage files: ${files.join(", ")}`);

    const inputs = read(files);
    core.debug(`File contents: ${JSON.stringify(inputs)}`);

    let output = merge(inputs);
    core.debug(`Merged coverage: ${JSON.stringify(output)}`);

    let prefix = core.getInput('remove-prefix');
    if (prefix == 'github_workspace') {
      prefix = process.env.GITHUB_WORKSPACE;
    }
    // GH uses relative paths in its diffs
    if (!prefix.endsWith('/')) {
      prefix += '/';
    }
    output = removePrefixes(output, prefix);
    core.debug(`With prefixes removed: ${JSON.stringify(output)}`);

    const path = write(output);
    core.info(`Wrote merged coverage to ${path}`);

    // Set the output for the action
    core.setOutput('coverage-file', path);
  } catch (error) {
    core.setFailed(error.message);
  }
}

// resolve coverage file paths
function expand(pattern) {
  const files = glob.sync(pattern);
  if (files.length === 0) {
    throw new Error(`No coverage files found matching pattern: ${pattern}`);
  }
  return files
}

// load coverage files
function read(files) {
  return files.map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));
}

// merge coverage files together
function merge(inputs) {
  // Initialize combined coverage data
  const combinedCoverage = {};

  // Process each coverage file
  for (const data of inputs) {
    // format is {<name>: {"coverage": {<file>: [lines]}}}
    for (const singleRunCoverageData of Object.values(data)) {
      // Merge coverage data from each file
      for (const [filename, lineCoverage] of Object.entries(singleRunCoverageData["coverage"])) {
        if (!combinedCoverage[filename]) {
          combinedCoverage[filename] = lineCoverage.lines;
        } else {
          // For overlapping files, merge line coverage arrays
          // If either file has coverage for a line, consider it covered
          combinedCoverage[filename] = combinedCoverage[filename].map((coverage, index) => {
            return coverage || (lineCoverage.lines[index] || null);
          });
        }
      }
    }
  }

  return combinedCoverage;
}

// remove common prefix from file patht to convert absolute paths to relative paths
function removePrefixes(input, prefix) {
  if (prefix == "") return input;

  const result = {};
  for (const [filename, coverage] of Object.entries(input)) {
    let newFilename = filename;
    if (prefix && filename.startsWith(prefix)) {
      newFilename = filename.slice(prefix.length);
    }
    result[newFilename] = coverage;
  }
  return result;
}

// Write the combined coverage data to a file
function write(output) {
  const path = 'coverage.json';
  fs.writeFileSync(path, JSON.stringify(output, null, 2));

  return path;
}

module.exports = {run, expand, read, merge, removePrefixes, write}

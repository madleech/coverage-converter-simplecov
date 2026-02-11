# Coverage Converter for Simplecov

This is a simple GitHub action that takes (one or more) Simplecov `.resultset.json` files and produces a single combined document.

## Usage

To use in a Github workflow, run your tests as normal, then add the following step:
```yaml
    - uses: madleech/coverage-converter-simplecov
```

This will read in `coverage/.resultset.json` from RSpec and produce `coverage.json` with the following format:
```json
{
  "test.rb": [null, null, 1, 1, 0, null]
}
```

## SimpleCov JSON Formatter

While this works, without configuration, with the `.resultset.json` file that SimpleCov internally produces, this has a number of issues:
1. It's an internal format and subject to change.
2. It doesn't take into account `:nocov:` blocks that `SimpleCov::LinesClassifier` would remove.

So it is better to configure the `SimpleCov::Formatter::JSONFormatter` that SimpleCov comes bundled with. To use, set the following in your `spec_helper.rb` file:

```ruby
require "simplecov_json_formatter"

SimpleCov.formatters = [
  SimpleCov::Formatter::HTMLFormatter,
  SimpleCov::Formatter::JSONFormatter
]
```

... and change your action to:
```yaml
    - uses: madleech/coverage-converter-simplecov
      with:
        coverage-file: "**/coverage.json"
```

## Combining Multiple Resultsets

If you're using something like [Knapsack](https://github.com/KnapsackPro/knapsack) to run your test suite in parallel, you'll likely end up with multiple `.resultset.json` files which need combining. While Simplecov does have some hidden functionality for merging multiple coverage files, this action can handle it automatically:

```yaml
    - uses: madleech/coverage-converter-simplecov
      with:
        coverage-file: "**/.resultset.json"
```

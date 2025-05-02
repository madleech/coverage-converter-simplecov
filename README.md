# Coverage Converter for Simplecov

This is a simple action that takes (one or more) Simplecov `.resultset.json` files and produces a single combined document.

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

## Combining Multiple Resultsets

If you're using something like [Knapsack](https://github.com/KnapsackPro/knapsack) to run your test suite in parallel, you'll likely end up with multiple `.resultset.json` files which need combining. While Simplecov does have some hidden functionality for merging multiple coverage files, this action can handle it automatically:

```yaml
    - uses: madleech/coverage-converter-simplecov
      with:
        coverage-file: "**/.resultset.json"
```

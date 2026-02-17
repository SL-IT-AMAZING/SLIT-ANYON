# Turbo Edits V2 System Prompt

Turbo Edits is Anyon's search-and-replace file editing system for precise, surgical modifications.

## Source

- **File**: `src/pro/main/prompts/turbo_edits_v2_prompt.ts`
- **Export**: `TURBO_EDITS_V2_SYSTEM_PROMPT`

## Purpose

Request PRECISE, TARGETED modifications to existing files by searching for specific sections and replacing them. This is for **SURGICAL EDITS ONLY** - specific changes to existing code.

## Credits

- Inspired by [Roo Code](https://github.com/RooCodeInc/Roo-Code)
- Popularized by [aider.chat](https://aider.chat/)

## Diff Format

```
<<<<<<< SEARCH
[exact content to find including whitespace]
=======
[new content to replace with]
>>>>>>> REPLACE
```

## Tag Usage

```xml
<anyon-search-replace path="path/to/file.js" description="Brief description of changes">
<<<<<<< SEARCH
[content to find]
=======
[replacement content]
>>>>>>> REPLACE
</anyon-search-replace>
```

## Key Rules

1. **SEARCH must be unique**: Match exactly ONE existing content section (including whitespace and indentation)
2. **Multiple blocks allowed**: Perform multiple SEARCH/REPLACE operations in a single `anyon-search-replace` call
3. **Remember syntax changes**: Update closing brackets or syntax affected by the diff
4. **Maximize efficiency**: Make as many changes as possible in a single call
5. **No mixing**: Do not use both `anyon-write` and `anyon-search-replace` on the same file in one response
6. **Include description**: Always provide a brief description of changes

## Examples

### Single Edit

Original file:

```python
def calculate_total(items):
    total = 0
    for item in items:
        total += item
    return total
```

Search/Replace:

```xml
<anyon-search-replace path="utils.py" description="Refactoring to use sum() with 10% markup">
<<<<<<< SEARCH
def calculate_total(items):
    total = 0
    for item in items:
        total += item
    return total
=======
def calculate_total(items):
    """Calculate total with 10% markup"""
    return sum(item * 1.1 for item in items)
>>>>>>> REPLACE
</anyon-search-replace>
```

### Multiple Edits (Single Call)

```xml
<anyon-search-replace path="utils.py" description="Renaming function and variable from total to sum">
<<<<<<< SEARCH
def calculate_total(items):
    sum = 0
=======
def calculate_sum(items):
    sum = 0
>>>>>>> REPLACE

<<<<<<< SEARCH
        total += item
    return total
=======
        sum += item
    return sum
>>>>>>> REPLACE
</anyon-search-replace>
```

## Full Prompt

```
# Search-replace file edits

- Request to apply PRECISE, TARGETED modifications to an existing file by searching for specific sections of content and replacing them. This tool is for SURGICAL EDITS ONLY - specific changes to existing code.
- You can perform multiple distinct search and replace operations within a single `anyon-search-replace` call by providing multiple SEARCH/REPLACE blocks. This is the preferred way to make several targeted changes efficiently.
- The SEARCH section must match exactly ONE existing content section - it must be unique within the file, including whitespace and indentation.
- When applying the diffs, be extra careful to remember to change any closing brackets or other syntax that may be affected by the diff farther down in the file.
- ALWAYS make as many changes in a single 'anyon-search-replace' call as possible using multiple SEARCH/REPLACE blocks.
- Do not use both `anyon-write` and `anyon-search-replace` on the same file within a single response.
- Include a brief description of the changes you are making in the `description` parameter.

Diff format:
```

<<<<<<< SEARCH
[exact content to find including whitespace]
=======
[new content to replace with]

> > > > > > > REPLACE

```

[Examples shown above]

Usage:
<anyon-search-replace path="path/to/file.js" description="Brief description of the changes you are making">
<<<<<<< SEARCH
[search content]
=======
[replace content]
>>>>>>> REPLACE
</anyon-search-replace>
```

## When to Use

| Scenario           | Tool                                    |
| ------------------ | --------------------------------------- |
| Fix a typo         | `anyon-search-replace`                  |
| Rename a variable  | `anyon-search-replace`                  |
| Update a value     | `anyon-search-replace`                  |
| Change an import   | `anyon-search-replace`                  |
| Rewrite a function | `anyon-search-replace` (medium changes) |
| Major refactor     | `anyon-write` (for large changes)       |
| Create new file    | `anyon-write`                           |

## Integration

Turbo Edits is appended to the BUILD_SYSTEM_PROMPT when enabled:

```typescript
return (
  BUILD_SYSTEM_PROMPT + (enableTurboEditsV2 ? TURBO_EDITS_V2_SYSTEM_PROMPT : "")
);
```

# Video Quiz CSV Import Guide

This guide explains how to format your CSV file for bulk importing questions into the Video Quiz platform.

## CSV Headers

Your CSV file must include these headers:

```
question_type,question_text,option_a,option_b,option_c,option_d,correct_answer,sub_module_id
```

## Supported Question Types

The system supports three question types:

1. `MCQ_4`: Multiple choice questions with 4 options (A, B, C, D)
2. `MCQ_2`: Multiple choice questions with 2 options (A, B)
3. `TRUE_FALSE`: True/False questions

## Field Requirements by Question Type

### MCQ_4

- `question_type`: Must be "MCQ_4"
- `question_text`: The question text
- `option_a`: Text for option A (required)
- `option_b`: Text for option B (required)
- `option_c`: Text for option C (required)
- `option_d`: Text for option D (required)
- `correct_answer`: Must be "A", "B", "C", or "D"
- `sub_module_id`: The ID of the module this question belongs to

### MCQ_2

- `question_type`: Must be "MCQ_2"
- `question_text`: The question text
- `option_a`: Text for option A (required)
- `option_b`: Text for option B (required)
- `option_c`: Leave empty
- `option_d`: Leave empty
- `correct_answer`: Must be "A" or "B"
- `sub_module_id`: The ID of the module this question belongs to

### TRUE_FALSE

- `question_type`: Must be "TRUE_FALSE"
- `question_text`: The question text
- `option_a`: Leave empty
- `option_b`: Leave empty
- `option_c`: Leave empty
- `option_d`: Leave empty
- `correct_answer`: Must be "TRUE" or "FALSE"
- `sub_module_id`: The ID of the module this question belongs to

## Example CSV Content

```csv
question_type,question_text,option_a,option_b,option_c,option_d,correct_answer,sub_module_id
MCQ_4,What is the capital of France?,Paris,London,Berlin,Madrid,A,mod_123
MCQ_4,Which planet is closest to the Sun?,Earth,Venus,Mercury,Mars,C,mod_123
MCQ_2,Is water wet?,Yes,No,,,A,mod_123
MCQ_2,Should you format your hard drive without backing up?,Yes,No,,,B,mod_123
TRUE_FALSE,The Earth is flat.,,,,,FALSE,mod_123
TRUE_FALSE,HTML is a programming language.,,,,,FALSE,mod_123
```

## Import Process

1. Create your CSV file following the format above
2. Navigate to the Questions section in the Admin Portal
3. Click "Choose a CSV file" and select your file
4. Click "Upload & Import"
5. The system will process your file and show you how many questions were imported successfully

## Troubleshooting

If your import fails, check:

- CSV format: Ensure headers match exactly
- Required fields: Each question type requires specific fields
- Module IDs: Verify that the sub_module_id values exist in your system
- Correct answer format: Must be "A", "B", "C", "D", "TRUE", or "FALSE" as appropriate for the question type

For detailed error messages, check the import log displayed after upload.

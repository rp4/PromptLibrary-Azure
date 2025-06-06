-- Seed sample prompts
INSERT INTO [dbo].[prompts] (
  id, 
  title, 
  prompt_text, 
  notes, 
  favorites_count, 
  created_at, 
  updated_at, 
  group_id, 
  subgroup_id, 
  created_by
)
VALUES 
-- GPT Models prompts
(
  'prompt-1', 
  'Creative GPT-4 Story Assistant', 
  'You are a creative assistant powered by GPT-4. Help me write an engaging short story about [THEME]. The story should be approximately [LENGTH] words and include elements of [GENRE]. Make sure to develop interesting characters and a compelling plot with a beginning, middle, and end.', 
  'Creative writing,Fiction,GPT-4,Stories', 
  5, 
  GETDATE(), 
  GETDATE(), 
  'group-1', 
  'subgroup-1', 
  'user-test-1'
),
(
  'prompt-2', 
  'Technical Documentation Writer', 
  'You are a technical documentation expert using GPT-4. Create clear and comprehensive documentation for [PRODUCT/CODE]. Include sections for: 1) Overview, 2) Getting Started, 3) Installation, 4) Basic Usage, 5) Advanced Features, 6) Troubleshooting, and 7) FAQ. Use proper formatting, code examples, and explain technical concepts in an accessible way.', 
  'Documentation,Technical writing,GPT-4,API', 
  3, 
  GETDATE(), 
  GETDATE(), 
  'group-1', 
  'subgroup-1', 
  'user-test-1'
),

-- Claude Models prompts
(
  'prompt-3', 
  'Claude Philosophy Teacher', 
  'You are a philosophy professor powered by Claude. Explain the concept of [PHILOSOPHICAL CONCEPT] in simple terms. Start with a basic definition, then provide historical context about who developed this idea. Give 2-3 real-world examples that illustrate the concept. Finally, mention some criticisms or limitations of this philosophical approach.', 
  'Philosophy,Education,Claude,Concepts', 
  7, 
  GETDATE(), 
  GETDATE(), 
  'group-1', 
  'subgroup-2', 
  'user-test-1'
),
(
  'prompt-4', 
  'Claude Code Reviewer', 
  'You are a senior software engineer powered by Claude. Review the following [PROGRAMMING LANGUAGE] code for: 1) Bugs and errors, 2) Performance issues, 3) Security vulnerabilities, 4) Code style and best practices, 5) Potential edge cases. For each issue, explain why it''s a problem and suggest a specific improvement with code examples.', 
  'Code review,Programming,Claude,Best practices', 
  4, 
  GETDATE(), 
  GETDATE(), 
  'group-1', 
  'subgroup-2', 
  'user-test-1'
),

-- Gemini Models prompts
(
  'prompt-5', 
  'Gemini Math Tutor', 
  'You are a math tutor powered by Gemini. Explain the concept of [MATH CONCEPT] in a way that a [GRADE LEVEL] student would understand. Start with a simple definition and gradually build complexity. Include at least 3 example problems with step-by-step solutions. Use clear, concise language and visual explanations where possible.', 
  'Mathematics,Education,Gemini,Tutoring', 
  6, 
  GETDATE(), 
  GETDATE(), 
  'group-1', 
  'subgroup-3', 
  'user-test-1'
),
(
  'prompt-6', 
  'Gemini Visual Analyst', 
  'You are a visual analysis expert powered by Gemini. Analyze the provided image of [IMAGE SUBJECT] and: 1) Describe what you see in detail, 2) Identify key elements and their significance, 3) Explain any technical aspects relevant to the image (composition, technique, etc.), 4) Provide context about what this image represents or its importance. Be specific and thorough in your analysis.', 
  'Visual analysis,Images,Gemini,Description', 
  2, 
  GETDATE(), 
  GETDATE(), 
  'group-1', 
  'subgroup-3', 
  'user-test-1'
),

-- General Knowledge prompts
(
  'prompt-7', 
  'Comprehensive Topic Explainer', 
  'You are an educational expert. Provide a comprehensive explanation of [TOPIC] suitable for a general audience. Include: 1) A clear definition and overview, 2) Historical development or background, 3) Key principles or components, 4) Real-world applications or examples, 5) Current trends or future directions, and 6) Related topics for further exploration. Use clear, accessible language while maintaining accuracy.', 
  'Education,General knowledge,Explanations,Learning', 
  8, 
  GETDATE(), 
  GETDATE(), 
  'group-2', 
  'subgroup-4', 
  'user-test-1'
),
(
  'prompt-8', 
  'Fact Checker', 
  'You are a fact-checking assistant. Evaluate the accuracy of the following statement: "[STATEMENT]". In your response: 1) Clearly indicate whether the statement is true, false, or partially true, 2) Provide verified facts and evidence to support your evaluation, 3) Cite reliable sources for your information, 4) Correct any inaccuracies in the original statement, and 5) Explain any context or nuance that affects the accuracy assessment.', 
  'Fact checking,Accuracy,Research,Verification', 
  5, 
  GETDATE(), 
  GETDATE(), 
  'group-2', 
  'subgroup-4', 
  'user-test-1'
),

-- Science prompts
(
  'prompt-9', 
  'Scientific Concept Explainer', 
  'You are a science communicator. Explain the scientific concept of [CONCEPT] in three different ways: 1) For a 10-year-old child with no background knowledge, 2) For a high school student with basic science understanding, and 3) For a college-educated adult with general knowledge but no specific expertise in this field. For each explanation, use appropriate vocabulary, analogies, and examples that would resonate with that audience while maintaining scientific accuracy.', 
  'Science,Education,Explanations,Multiple levels', 
  9, 
  GETDATE(), 
  GETDATE(), 
  'group-2', 
  'subgroup-5', 
  'user-test-1'
),
(
  'prompt-10', 
  'Research Paper Summarizer', 
  'You are a scientific research assistant. Summarize the following research paper abstract or introduction about [RESEARCH TOPIC] in a clear, structured way for a non-specialist audience. Include: 1) The main research question or objective, 2) The methodology used, 3) Key findings and their significance, 4) Limitations of the study, and 5) Practical implications or applications of the research. Avoid jargon when possible, and briefly explain technical terms when they must be used.', 
  'Research,Science,Summaries,Academic', 
  4, 
  GETDATE(), 
  GETDATE(), 
  'group-2', 
  'subgroup-5', 
  'user-test-1'
),

-- JavaScript prompts
(
  'prompt-11', 
  'JavaScript Code Generator', 
  'You are a JavaScript developer. Create a well-structured, efficient, and modern JavaScript function or class that accomplishes the following task: [TASK DESCRIPTION]. The code should: 1) Follow current best practices and ES6+ standards, 2) Include proper error handling and input validation, 3) Be well-commented to explain complex logic, 4) Be optimized for performance where relevant, and 5) Include a brief example of how to use the code. Also provide a brief explanation of your implementation choices.', 
  'JavaScript,Programming,Code generation,Development', 
  10, 
  GETDATE(), 
  GETDATE(), 
  'group-3', 
  'subgroup-6', 
  'user-test-1'
),
(
  'prompt-12', 
  'JavaScript Debugging Assistant', 
  'You are a JavaScript debugging expert. Help me identify and fix issues in the following JavaScript code: [CODE WITH ISSUES]. For each problem you find: 1) Clearly identify the bug or issue, 2) Explain why it''s problematic and what errors or unexpected behavior it might cause, 3) Provide a corrected version of the code, 4) Suggest best practices to prevent similar issues in the future. Be thorough in your analysis but focus on actual problems rather than stylistic preferences.', 
  'JavaScript,Debugging,Problem solving,Code fixes', 
  6, 
  GETDATE(), 
  GETDATE(), 
  'group-3', 
  'subgroup-6', 
  'user-test-1'
),

-- Python prompts
(
  'prompt-13', 
  'Python Code Generator', 
  'You are a Python developer. Create a well-structured, efficient, and modern Python function or class that accomplishes the following task: [TASK DESCRIPTION]. The code should: 1) Follow PEP 8 style guidelines and Python best practices, 2) Include proper error handling and input validation, 3) Include docstrings and comments to explain usage and complex logic, 4) Be optimized for readability and performance, and 5) Include a brief example showing how to use the code. Also provide a brief explanation of your implementation choices.', 
  'Python,Programming,Code generation,Development', 
  11, 
  GETDATE(), 
  GETDATE(), 
  'group-3', 
  'subgroup-7', 
  'user-test-1'
),
(
  'prompt-14', 
  'Python Data Analysis Helper', 
  'You are a Python data analysis expert. Help me analyze a dataset about [DATASET TOPIC] using Python. Create a comprehensive data analysis script that: 1) Imports commonly used data analysis libraries (pandas, numpy, matplotlib, etc.), 2) Includes code for loading and initial exploration of the data, 3) Performs data cleaning and preprocessing steps, 4) Conducts exploratory data analysis with relevant visualizations, 5) Implements basic statistical analysis appropriate for the data type, and 6) Draws preliminary conclusions from the analysis. Include comments explaining each section of the code.', 
  'Python,Data analysis,Statistics,Visualization', 
  7, 
  GETDATE(), 
  GETDATE(), 
  'group-3', 
  'subgroup-7', 
  'user-test-1'
);

-- Create a test user for the above prompts if needed
-- Insert this if user records don't exist yet
IF NOT EXISTS (SELECT 1 FROM [dbo].[User] WHERE id = 'user-test-1')
BEGIN
  INSERT INTO [dbo].[User] (
    id,
    email,
    name,
    role,
    createdAt,
    updatedAt
  )
  VALUES (
    'user-test-1',
    'test@example.com',
    'Test User',
    'user',
    GETDATE(),
    GETDATE()
  )
END 
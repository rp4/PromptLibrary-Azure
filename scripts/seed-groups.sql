-- Seed Groups table
INSERT INTO [dbo].[groups] (id, name, order_id, created_at, updated_at)
VALUES 
  ('group-1', 'AI Models', 1, GETDATE(), GETDATE()),
  ('group-2', 'Topics', 2, GETDATE(), GETDATE()),
  ('group-3', 'Programming', 3, GETDATE(), GETDATE());

-- Seed Subgroups table
INSERT INTO [dbo].[subgroups] (id, name, group_id, order_id, created_at, updated_at)
VALUES 
  ('subgroup-1', 'GPT Models', 'group-1', 1, GETDATE(), GETDATE()),
  ('subgroup-2', 'Claude Models', 'group-1', 2, GETDATE(), GETDATE()),
  ('subgroup-3', 'Gemini Models', 'group-1', 3, GETDATE(), GETDATE()),
  ('subgroup-4', 'General Knowledge', 'group-2', 1, GETDATE(), GETDATE()),
  ('subgroup-5', 'Science', 'group-2', 2, GETDATE(), GETDATE()),
  ('subgroup-6', 'JavaScript', 'group-3', 1, GETDATE(), GETDATE()),
  ('subgroup-7', 'Python', 'group-3', 2, GETDATE(), GETDATE()); 
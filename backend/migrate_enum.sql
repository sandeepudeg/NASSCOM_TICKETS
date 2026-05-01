
-- Migration to update category_enum values to lowercase
ALTER TYPE category_enum RENAME VALUE 'Infrastructure' TO 'infrastructure';
ALTER TYPE category_enum RENAME VALUE 'Application' TO 'application';
ALTER TYPE category_enum RENAME VALUE 'Security' TO 'security';
ALTER TYPE category_enum RENAME VALUE 'Database' TO 'database';
ALTER TYPE category_enum RENAME VALUE 'Storage' TO 'storage';
ALTER TYPE category_enum RENAME VALUE 'Network' TO 'network';
ALTER TYPE category_enum RENAME VALUE 'Access Management' TO 'access';

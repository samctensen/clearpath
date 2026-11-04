-- Keyset paging walks the queue by (sort key, created_at, id) inside one workspace.
CREATE INDEX IF NOT EXISTS cases_workspace_status_created_idx ON cases (workspace_id, status, created_at, id);
CREATE INDEX IF NOT EXISTS cases_workspace_created_idx ON cases (workspace_id, created_at, id);
CREATE INDEX IF NOT EXISTS revisions_product_idx ON revisions ((input->>'productId'));
CREATE INDEX IF NOT EXISTS revisions_launch_date_idx ON revisions ((input->>'launchDate'));

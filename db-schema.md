| db_schema                                          |
| -------------------------------------------------- |
| {                                                  |
| "enums": null,                                     |
| "tables": [                                        |
| {                                                  |
| "table": "admin_smtp",                             |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "name",                                    |
| "type": "text",                                    |
| "default": "''::text",                             |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "username",                                |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "host",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "port",                                    |
| "type": "integer",                                 |
| "default": "587",                                  |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "secure",                                  |
| "type": "boolean",                                 |
| "default": "false",                                |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "password",                                |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "iv",                                      |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "isActive",                                |
| "type": "boolean",                                 |
| "default": "false",                                |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "admin_smtp_pkey"                                  |
| ],                                                 |
| "triggers": [                                      |
| "trg_admin_smtp_updated"                           |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "admin_smtp_pkey",                         |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18030_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18030_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18030_4_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18030_5_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18030_6_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18030_9_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "admin_smtp_no_select",                    |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "ai_settings",                            |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "settings",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "ai_settings_pkey",                                |
| "uq_ai_settings_user",                             |
| "idx_ai_settings_user"                             |
| ],                                                 |
| "triggers": [                                      |
| "trg_ai_settings_updated"                          |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "ai_settings_pkey",                        |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "ai_settings_user_id_fkey",                |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17932_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17932_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17932_3_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "ai_settings_select",                      |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "ai_settings_insert",                      |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "ai_settings_update",                      |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "ai_settings_delete",                      |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "ai_usage_logs",                          |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "provider",                                |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "model",                                   |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "input_tokens",                            |
| "type": "integer",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "output_tokens",                           |
| "type": "integer",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "total_tokens",                            |
| "type": "integer",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "actual_provider_cost",                    |
| "type": "numeric",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "charged_credits",                         |
| "type": "numeric",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "input_price_used",                        |
| "type": "numeric",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "output_price_used",                       |
| "type": "numeric",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "markup_used",                             |
| "type": "numeric",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "credit_value_used",                       |
| "type": "numeric",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "request_type",                            |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "ai_usage_logs_pkey",                              |
| "idx_ai_usage_user"                                |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "ai_usage_logs_pkey",                      |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "ai_usage_logs_user_id_fkey",              |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17971_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_5_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_6_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_7_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_8_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_9_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_10_not_null",                  |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_11_not_null",                  |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_12_not_null",                  |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_13_not_null",                  |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17971_15_not_null",                  |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "ai_usage_logs_select",                    |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "ai_usage_logs_insert",                    |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "ai_usage_logs_delete",                    |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "artifacts",                              |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "filename",                                |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "mime_type",                               |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "storage_path",                            |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "artifacts_pkey",                                  |
| "idx_artifacts_user"                               |
| ],                                                 |
| "triggers": [                                      |
| "trg_artifacts_updated"                            |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "artifacts_pkey",                          |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "artifacts_user_id_fkey",                  |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17767_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17767_2_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "artifacts_select",                        |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "artifacts_insert",                        |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "artifacts_update",                        |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "artifacts_delete",                        |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "attachments",                            |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "public_id",                               |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "url",                                     |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "format",                                  |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "bytes",                                   |
| "type": "bigint",                                  |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "attachments_pkey",                                |
| "idx_attachments_user"                             |
| ],                                                 |
| "triggers": [                                      |
| "trg_attachments_updated"                          |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "attachments_pkey",                        |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "attachments_user_id_fkey",                |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17752_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17752_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17752_4_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17752_9_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "attachments_select",                      |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "attachments_insert",                      |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "attachments_update",                      |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "attachments_delete",                      |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "audit_logs",                             |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "action",                                  |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "details",                                 |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "audit_logs_pkey",                                 |
| "idx_audit_logs_user",                             |
| "idx_audit_logs_action"                            |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "audit_logs_pkey",                         |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "audit_logs_user_id_fkey",                 |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18298_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18298_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18298_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18298_4_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "audit_logs_select",                       |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "audit_logs_insert",                       |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "billing_settings",                       |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "config",                                  |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "billing_settings_pkey",                           |
| "uq_billing_settings_user",                        |
| "idx_billing_settings_user"                        |
| ],                                                 |
| "triggers": [                                      |
| "trg_billing_settings_updated"                     |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "billing_settings_pkey",                   |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "billing_settings_user_id_fkey",           |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17916_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17916_3_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "billing_settings_select",                 |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "billing_settings_insert",                 |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "billing_settings_update",                 |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "billing_settings_delete",                 |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "categories",                             |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "name",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "categories_pkey",                                 |
| "idx_categories_user"                              |
| ],                                                 |
| "triggers": [                                      |
| "trg_categories_updated"                           |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "categories_pkey",                         |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "categories_user_id_fkey",                 |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17798_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17798_3_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "categories_select",                       |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "categories_insert",                       |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "categories_update",                       |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "categories_delete",                       |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "chats",                                  |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "sessions",                                |
| "type": "jsonb",                                   |
| "default": "'[]'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "chats_pkey",                                      |
| "uq_chats_user",                                   |
| "idx_chats_user"                                   |
| ],                                                 |
| "triggers": [                                      |
| "trg_chats_updated"                                |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "chats_pkey",                              |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "chats_user_id_fkey",                      |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17782_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17782_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17782_3_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "chats_select",                            |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "chats_insert",                            |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "chats_update",                            |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "chats_delete",                            |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "communication_settings",                 |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "config",                                  |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "communication_settings_pkey",                     |
| "uq_comm_settings_user",                           |
| "idx_comm_settings_user"                           |
| ],                                                 |
| "triggers": [                                      |
| "trg_comm_settings_updated"                        |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "communication_settings_pkey",             |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "communication_settings_user_id_fkey",     |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17995_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17995_3_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "comm_settings_select",                    |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "comm_settings_insert",                    |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "comm_settings_update",                    |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "comm_settings_delete",                    |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "credit_packs",                           |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "name",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "amount",                                  |
| "type": "integer",                                 |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "price",                                   |
| "type": "integer",                                 |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "currency",                                |
| "type": "text",                                    |
| "default": "'NGN'::text",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "active",                                  |
| "type": "boolean",                                 |
| "default": "true",                                 |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "createdAt",                               |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updatedAt",                               |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "credit_packs_pkey"                                |
| ],                                                 |
| "triggers": [                                      |
| "trg_credit_packs_updated"                         |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "credit_packs_pkey",                       |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17860_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17860_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17860_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17860_4_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17860_5_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17860_6_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "credit_packs_select",                     |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "credit_transactions",                    |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "wallet_id",                               |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "type",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "amount",                                  |
| "type": "numeric",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "balance_before",                          |
| "type": "numeric",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "balance_after",                           |
| "type": "numeric",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "reference",                               |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "description",                             |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "credit_transactions_pkey",                        |
| "idx_credit_transactions_uid",                     |
| "idx_credit_transactions_wlt"                      |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "credit_transactions_pkey",                |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "credit_transactions_user_id_fkey",        |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "credit_transactions_wallet_id_fkey",      |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17888_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17888_2_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "credit_transactions_select",              |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "credit_transactions_insert",              |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "credit_transactions_delete",              |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "credits_wallets",                        |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "balance",                                 |
| "type": "integer",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "total_purchased",                         |
| "type": "integer",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "total_consumed",                          |
| "type": "integer",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "credits_wallets_pkey",                            |
| "uq_credits_wallets_user",                         |
| "idx_credits_wallets_user"                         |
| ],                                                 |
| "triggers": [                                      |
| "trg_credits_wallets_updated"                      |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "credits_wallets_pkey",                    |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "credits_wallets_user_id_fkey",            |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17872_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17872_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17872_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17872_4_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17872_5_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "credits_wallets_select",                  |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "credits_wallets_insert",                  |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "credits_wallets_update",                  |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "credits_wallets_delete",                  |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "document_templates",                     |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "name",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "content",                                 |
| "type": "jsonb",                                   |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "is_global",                               |
| "type": "boolean",                                 |
| "default": "false",                                |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_by",                              |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "document_templates_pkey",                         |
| "idx_document_templates_user"                      |
| ],                                                 |
| "triggers": [                                      |
| "trg_doc_templates_updated"                        |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "document_templates_created_by_fkey",      |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "document_templates_pkey",                 |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "document_templates_user_id_fkey",         |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17700_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17700_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17700_5_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "document_templates_select",               |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "document_templates_insert",               |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "document_templates_update",               |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "document_templates_delete",               |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "documents",                              |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "title",                                   |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "storage_path",                            |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "documents_pkey",                                  |
| "idx_documents_user"                               |
| ],                                                 |
| "triggers": [                                      |
| "trg_documents_updated"                            |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "documents_pkey",                          |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "documents_user_id_fkey",                  |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17721_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17721_2_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "documents_select",                        |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "documents_insert",                        |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "documents_update",                        |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "documents_delete",                        |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "emails",                                 |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "to_email",                                |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "subject",                                 |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "body",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "sent_at",                                 |
| "type": "timestamp with time zone",                |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "emails_pkey",                                     |
| "idx_emails_user"                                  |
| ],                                                 |
| "triggers": [                                      |
| "trg_emails_updated"                               |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "emails_pkey",                             |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "emails_user_id_fkey",                     |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17670_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17670_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17670_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17670_9_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "emails_select",                           |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "emails_insert",                           |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "emails_update",                           |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "emails_delete",                           |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "feedback",                               |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "rating",                                  |
| "type": "integer",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "comment",                                 |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "feedback_pkey",                                   |
| "idx_feedback_user"                                |
| ],                                                 |
| "triggers": [                                      |
| "trg_feedback_updated"                             |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "feedback_pkey",                           |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "feedback_rating_check",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "feedback_user_id_fkey",                   |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18060_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18060_2_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "feedback_select",                         |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "feedback_insert",                         |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "feedback_update",                         |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "feedback_delete",                         |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "gateway_settings",                       |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "price",                                   |
| "type": "integer",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "currency",                                |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "durationMonths",                          |
| "type": "integer",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "active",                                  |
| "type": "boolean",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updatedAt",                               |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "config",                                  |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "gateway_settings_pkey"                            |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "gateway_settings_pkey",                   |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17907_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17907_7_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "gateway_settings_select",                 |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "jobs",                                   |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "project_id",                              |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "status",                                  |
| "type": "text",                                    |
| "default": "'pending'::text",                      |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "payload",                                 |
| "type": "jsonb",                                   |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "jobs_pkey",                                       |
| "idx_jobs_user",                                   |
| "idx_jobs_project"                                 |
| ],                                                 |
| "triggers": [                                      |
| "trg_jobs_updated"                                 |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "jobs_pkey",                               |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "jobs_project_id_fkey",                    |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "jobs_user_id_fkey",                       |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17649_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17649_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17649_4_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "jobs_select",                             |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "jobs_insert",                             |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "jobs_update",                             |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "jobs_delete",                             |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "model_catalog",                          |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "customModels",                            |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "model_catalog_pkey"                               |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "model_catalog_pkey",                      |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17948_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17948_2_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "model_catalog_select",                    |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "model_pricing",                          |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "provider",                                |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "model",                                   |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "input_cost_per_million",                  |
| "type": "numeric",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "output_cost_per_million",                 |
| "type": "numeric",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "markup_multiplier",                       |
| "type": "numeric",                                 |
| "default": "1.0",                                  |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "active",                                  |
| "type": "boolean",                                 |
| "default": "true",                                 |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "model_pricing_pkey",                              |
| "idx_model_pricing_provider"                       |
| ],                                                 |
| "triggers": [                                      |
| "trg_model_pricing_updated"                        |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "model_pricing_pkey",                      |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17957_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17957_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17957_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17957_4_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17957_5_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17957_6_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17957_7_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "model_pricing_select",                    |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "profiles",                               |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "data",                                    |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "profiles_pkey",                                   |
| "idx_profiles_id"                                  |
| ],                                                 |
| "triggers": [                                      |
| "trg_profiles_updated"                             |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "profiles_id_fkey",                        |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "profiles_pkey",                           |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17619_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17619_2_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "profiles_select",                         |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "profiles_insert",                         |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "profiles_update",                         |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "profiles_delete",                         |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "projects",                               |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "title",                                   |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "description",                             |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "meta",                                    |
| "type": "jsonb",                                   |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "projects_pkey",                                   |
| "idx_projects_user"                                |
| ],                                                 |
| "triggers": [                                      |
| "trg_projects_updated"                             |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "projects_pkey",                           |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "projects_user_id_fkey",                   |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17634_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17634_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17634_3_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "projects_select",                         |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "projects_insert",                         |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "projects_update",                         |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "projects_delete",                         |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "recipients",                             |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "email",                                   |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "name",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "recipients_pkey",                                 |
| "idx_recipients_user"                              |
| ],                                                 |
| "triggers": [                                      |
| "trg_recipients_updated"                           |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "recipients_pkey",                         |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "recipients_user_id_fkey",                 |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17813_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17813_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17813_7_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "recipients_select",                       |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "recipients_insert",                       |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "recipients_update",                       |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "recipients_delete",                       |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "schedule_executions",                    |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "schedule_id",                             |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "message_id",                              |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "status",                                  |
| "type": "text",                                    |
| "default": "'started'::text",                      |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "started_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "finished_at",                             |
| "type": "timestamp with time zone",                |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "error",                                   |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "retry_count",                             |
| "type": "integer",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "schedule_executions_pkey",                        |
| "idx_schedule_executions_schedule",                |
| "idx_schedule_executions_user"                     |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "schedule_executions_pkey",                |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "schedule_executions_user_id_fkey",        |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18266_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18266_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18266_5_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18266_9_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18266_10_not_null",                  |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "schedule_executions_select",              |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "schedule_executions_insert",              |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "schedule_executions_update",              |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "scheduler_idempotency",                  |
| "columns": [                                       |
| {                                                  |
| "name": "message_id",                              |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "scheduler_idempotency_pkey"                       |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "scheduler_idempotency_pkey",              |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18284_1_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "scheduler_idempotency_no_select",         |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "schedules",                              |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "cron_expr",                               |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "task_data",                               |
| "type": "jsonb",                                   |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "next_run",                                |
| "type": "timestamp with time zone",                |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "is_active",                               |
| "type": "boolean",                                 |
| "default": "true",                                 |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "schedules_pkey",                                  |
| "idx_schedules_user"                               |
| ],                                                 |
| "triggers": [                                      |
| "trg_schedules_updated"                            |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "schedules_pkey",                          |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "schedules_user_id_fkey",                  |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17828_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17828_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17828_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17828_6_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "schedules_select",                        |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "schedules_insert",                        |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "schedules_delete",                        |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| },                                                 |
| {                                                  |
| "name": "schedules_update",                        |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "settings",                               |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "settings",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "settings_pkey",                                   |
| "uq_settings_user",                                |
| "idx_settings_user"                                |
| ],                                                 |
| "triggers": [                                      |
| "trg_settings_updated"                             |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "settings_pkey",                           |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "settings_user_id_fkey",                   |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18044_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18044_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18044_3_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "settings_select",                         |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "settings_insert",                         |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "settings_update",                         |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "settings_delete",                         |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "smtp_providers",                         |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "email",                                   |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "host",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "port",                                    |
| "type": "integer",                                 |
| "default": "587",                                  |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "secure",                                  |
| "type": "boolean",                                 |
| "default": "false",                                |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "appPassword",                             |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "iv",                                      |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "status",                                  |
| "type": "text",                                    |
| "default": "'pending'::text",                      |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "isDefault",                               |
| "type": "boolean",                                 |
| "default": "false",                                |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "lastVerifiedAt",                          |
| "type": "timestamp with time zone",                |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "smtp_providers_pkey",                             |
| "idx_smtp_providers_user"                          |
| ],                                                 |
| "triggers": [                                      |
| "trg_smtp_providers_updated"                       |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "smtp_providers_pkey",                     |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "smtp_providers_user_id_fkey",             |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18011_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18011_4_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18011_5_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18011_6_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18011_9_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18011_10_not_null",                  |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "smtp_providers_select",                   |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "smtp_providers_insert",                   |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "smtp_providers_update",                   |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "smtp_providers_delete",                   |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "template_preview_data",                  |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "data",                                    |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "template_preview_data_pkey",                      |
| "idx_template_preview_data_updated"                |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "template_preview_data_pkey",              |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18531_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18531_2_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": null                               |
| },                                                 |
| {                                                  |
| "table": "templates",                              |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "text",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "name",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "subject",                                 |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "body",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "type",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "idx_templates_user",                              |
| "templates_pkey"                                   |
| ],                                                 |
| "triggers": [                                      |
| "trg_templates_updated"                            |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "templates_pkey",                          |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "templates_user_id_fkey",                  |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17685_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17685_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17685_9_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "templates_select",                        |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "templates_insert",                        |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "templates_update",                        |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "templates_delete",                        |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "transactions",                           |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "type",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "amount",                                  |
| "type": "numeric",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "status",                                  |
| "type": "text",                                    |
| "default": "'pending'::text",                      |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "reference",                               |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "paystackReference",                       |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "authorizationUrl",                        |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "description",                             |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "createdAt",                               |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updatedAt",                               |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "packId",                                  |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "currency",                                |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "credits",                                 |
| "type": "numeric",                                 |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "paystackData",                            |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "completedAt",                             |
| "type": "timestamp with time zone",                |
| "default": null,                                   |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "transactions_pkey",                               |
| "idx_transactions_user",                           |
| "idx_transactions_ref",                            |
| "idx_transactions_pack"                            |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "transactions_pkey",                       |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "transactions_user_id_fkey",               |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17844_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17844_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17844_5_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "transactions_select",                     |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "transactions_insert",                     |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "uploads",                                |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": "uuid_generate_v4()",                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "user_id",                                 |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "public_id",                               |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "url",                                     |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "format",                                  |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "resource_type",                           |
| "type": "text",                                    |
| "default": "'image'::text",                        |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "bytes",                                   |
| "type": "bigint",                                  |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "created_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updated_at",                              |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "uploads_pkey",                                    |
| "idx_uploads_user"                                 |
| ],                                                 |
| "triggers": [                                      |
| "trg_uploads_updated"                              |
| ],                                                 |
| "constraints": [                                   |
| {                                                  |
| "name": "uploads_pkey",                            |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "uploads_user_id_fkey",                    |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_17736_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17736_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17736_3_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17736_4_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_17736_6_not_null",                   |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "uploads_select",                          |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "uploads_insert",                          |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "uploads_update",                          |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "uploads_delete",                          |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| },                                                 |
| {                                                  |
| "table": "users",                                  |
| "columns": [                                       |
| {                                                  |
| "name": "id",                                      |
| "type": "uuid",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "email",                                   |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "name",                                    |
| "type": "text",                                    |
| "default": null,                                   |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "role",                                    |
| "type": "text",                                    |
| "default": "'user'::text",                         |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "userVersion",                             |
| "type": "integer",                                 |
| "default": "1",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "starredTemplates",                        |
| "type": "jsonb",                                   |
| "default": "'[]'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "billingType",                             |
| "type": "text",                                    |
| "default": "'token'::text",                        |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "gatewayAccess",                           |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "credits",                                 |
| "type": "integer",                                 |
| "default": "0",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "creditExpiryBuckets",                     |
| "type": "jsonb",                                   |
| "default": "'[]'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "schemaVersion",                           |
| "type": "integer",                                 |
| "default": "1",                                    |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "metadata",                                |
| "type": "jsonb",                                   |
| "default": "'{}'::jsonb",                          |
| "nullable": "NO"                                   |
| },                                                 |
| {                                                  |
| "name": "createdAt",                               |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| },                                                 |
| {                                                  |
| "name": "updatedAt",                               |
| "type": "timestamp with time zone",                |
| "default": "now()",                                |
| "nullable": "YES"                                  |
| }                                                  |
| ],                                                 |
| "indexes": [                                       |
| "users_pkey",                                      |
| "users_email_key",                                 |
| "idx_users_email"                                  |
| ],                                                 |
| "triggers": null,                                  |
| "constraints": [                                   |
| {                                                  |
| "name": "users_email_key",                         |
| "type": "UNIQUE"                                   |
| },                                                 |
| {                                                  |
| "name": "users_id_fkey",                           |
| "type": "FOREIGN KEY"                              |
| },                                                 |
| {                                                  |
| "name": "users_pkey",                              |
| "type": "PRIMARY KEY"                              |
| },                                                 |
| {                                                  |
| "name": "2200_18236_1_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_2_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_4_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_5_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_6_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_7_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_8_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_9_not_null",                   |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_10_not_null",                  |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_11_not_null",                  |
| "type": "CHECK"                                    |
| },                                                 |
| {                                                  |
| "name": "2200_18236_12_not_null",                  |
| "type": "CHECK"                                    |
| }                                                  |
| ],                                                 |
| "rls_enabled": true,                               |
| "rls_policies": [                                  |
| {                                                  |
| "name": "users_select",                            |
| "type": "PERMISSIVE",                              |
| "command": "r"                                     |
| },                                                 |
| {                                                  |
| "name": "users_insert",                            |
| "type": "PERMISSIVE",                              |
| "command": "a"                                     |
| },                                                 |
| {                                                  |
| "name": "users_update",                            |
| "type": "PERMISSIVE",                              |
| "command": "w"                                     |
| },                                                 |
| {                                                  |
| "name": "users_delete",                            |
| "type": "PERMISSIVE",                              |
| "command": "d"                                     |
| }                                                  |
| ]                                                  |
| }                                                  |
| ],                                                 |
| "database": "postgres",                            |
| "generated_at": "2026-06-25T12:44:59.929784+00:00" |
| }                                                  |

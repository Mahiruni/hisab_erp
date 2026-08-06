-- Commit new role values before later migrations use them.
alter type public.app_role add value if not exists 'manager';
alter type public.app_role add value if not exists 'staff';

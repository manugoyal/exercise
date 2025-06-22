# Exercise

A webapp to manage my exercises.

## Starting the dev setup.

Start supabase and the web server

- `npm install && cd app && npm install`
- `npx supabase start`
- `npx supabase migration up`
- `cd app && npm start`

Generate seed data

```
npx tsx scripts/generate_seed_data.ts > seed_data.json
```

Import the data within the webapp! Dev credentials:

```
username: ice
password: cream
```

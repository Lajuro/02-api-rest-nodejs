import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transactions', (table) => {
    // Add the column as nullable first
    table.text('type').checkIn(['credit', 'debit']);
  });

  // Update existing rows with a default value
  await knex('transactions').update({ type: 'credit' });

  // Now make the column NOT NULL
  await knex.schema.alterTable('transactions', (table) => {
    table.text('type').notNullable().alter();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transactions', (table) => {
    table.dropColumn('type');
  });
}


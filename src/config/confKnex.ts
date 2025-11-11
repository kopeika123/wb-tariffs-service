import knex from 'knex';
import config from '../../knexfile';

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment];

if (!knexConfig) {
  throw new Error(`Knex configuration for environment "${environment}" not found.`);
}

export default knex(knexConfig);
import { POSTGRES_SSL_ENABLED } from '@/site/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ...(POSTGRES_SSL_ENABLED && {
    ssl: {
      rejectUnauthorized: false,
      ca: fs.readFileSync('./ca.crt').toString() || `-----BEGIN CERTIFICATE-----
      MIICAjCCAaigAwIBAgIQMyncQ/AJbkIz/fJZGURs4DAKBggqhkjOPQQDAjBFMQ4w
      DAYDVQQKEwV0ZW1ibzEUMBIGA1UECxMLZW5naW5lZXJpbmcxHTAbBgNVBAMTFGRh
      dGEtMS51c2UxLnRlbWJvLmlvMB4XDTI0MDYxNjE4MzEyNVoXDTI0MDkxNDE4MzEy
      NVowRTEOMAwGA1UEChMFdGVtYm8xFDASBgNVBAsTC2VuZ2luZWVyaW5nMR0wGwYD
      VQQDExRkYXRhLTEudXNlMS50ZW1iby5pbzBZMBMGByqGSM49AgEGCCqGSM49AwEH
      A0IABG0/UrHavEOYaTBYWarDSyclnIx+sGzUV6OGyD7df6pAYUeYUnisqspum3+6
      oXgZNuvJA20J8byjzqhkaCUwuyOjejB4MA4GA1UdDwEB/wQEAwICpDAPBgNVHRMB
      Af8EBTADAQH/MB0GA1UdDgQWBBSpNteX5bbaKsG4WMyRPkdggHkK2jA2BgNVHREE
      LzAtghVkYXRhLTEudXNlMS5jb3JlZGIuaW+CFGRhdGEtMS51c2UxLnRlbWJvLmlv
      MAoGCCqGSM49BAMCA0gAMEUCIQC0lWothy/At5FZLPX0lvLHiYge1urbi9ahMeYX
      CXaE8AIgMe8X9BDodiHeIb3tKNoonX8+aeEfn9Xm0uq4jrXCJXw=
      -----END CERTIFICATE-----`,
    },
  }),
});

export type Primitive = string | number | boolean | undefined | null;

export const query = async <T extends QueryResultRow = any>(
  queryString: string,
  values: Primitive[] = [],
) => {
  const client = await pool.connect();
  let response: QueryResult<T>;
  try {
    response = await client.query<T>(queryString, values);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
  return response;
};

export const sql = <T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
) => {
  if (!isTemplateStringsArray(strings) || !Array.isArray(values)) {
    throw new Error('Invalid template literal argument');
  }

  let result = strings[0] ?? '';

  for (let i = 1; i < strings.length; i++) {
    result += `$${i}${strings[i] ?? ''}`;
  }

  return query<T>(result, values);
};

export const convertArrayToPostgresString = (
  array?: string[],
  type: 'braces' | 'brackets' | 'parentheses' = 'braces',
) =>
  array
    ? type === 'braces'
      ? `{${array.join(',')}}`
      : type === 'brackets'
        ? `[${array.map((i) => `'${i}'`).join(',')}]`
        : `(${array.map((i) => `'${i}'`).join(',')})`
    : null;

const isTemplateStringsArray = (
  strings: unknown,
): strings is TemplateStringsArray => {
  return (
    Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw)
  );
};

export const testDatabaseConnection = async () =>
  query('SELECt COUNT(*) FROM pg_stat_user_tables');

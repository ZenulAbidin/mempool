jest.mock('../../api/mempool', () => ({
  __esModule: true,
  default: { getMempool: () => ({}) },
}));
jest.mock('../../api/blocks', () => ({
  __esModule: true,
  default: { getCurrentBlockHeight: () => 900000 },
}));
jest.mock('../../indexer', () => ({ __esModule: true, default: {} }));
// The real module imports the API factory, which subclasses BitcoinApi before it is defined.
jest.mock('../../api/transaction-utils', () => ({
  __esModule: true,
  default: { convertScriptSigAsm: () => '' },
}));

import BitcoinApi from '../../api/bitcoin/bitcoin-api';

const GENESIS_HASH = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
const GENESIS_TXID = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';

// Shape of block.tx[0] from `getblock <hash> 2`: unlike getrawtransaction, it has
// no blockhash, confirmations or blocktime.
const genesisCoinbase = {
  txid: GENESIS_TXID,
  hash: GENESIS_TXID,
  version: 1,
  size: 204,
  vsize: 204,
  weight: 816,
  locktime: 0,
  vin: [{
    coinbase: '04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73',
    sequence: 4294967295,
  }],
  vout: [{
    value: 50,
    n: 0,
    scriptPubKey: {
      asm: '',
      hex: '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
      type: 'pubkey',
    },
  }],
  hex: '',
};

describe('BitcoinApi genesis coinbase', () => {
  it('returns the genesis block hash in the transaction status', async () => {
    const client = {
      getRawTransaction: jest.fn().mockRejectedValue(
        new Error('The genesis block coinbase is not considered an ordinary transaction and cannot be retrieved'),
      ),
      getBlockHash: jest.fn().mockResolvedValue(GENESIS_HASH),
      getBlock: jest.fn().mockResolvedValue({ hash: GENESIS_HASH, time: 1231006505, tx: [{ ...genesisCoinbase }] }),
    };
    const api = new BitcoinApi(client);

    const tx = await api.$getRawTransaction(GENESIS_TXID);

    expect(client.getBlockHash).toHaveBeenCalledWith(0);
    expect(tx.txid).toBe(GENESIS_TXID);
    expect(tx.status).toEqual({
      confirmed: true,
      block_height: 0,
      block_hash: GENESIS_HASH,
      block_time: 1231006505,
    });
  });
});

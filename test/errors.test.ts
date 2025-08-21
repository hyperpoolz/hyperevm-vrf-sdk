import { describe, it, expect } from 'vitest';
import { PolicyViolationError, RoundMissingError, WrongBeaconError, AlreadyFulfilledError, TxError } from '../src/errors.js';

describe('Typed errors', () => {
  it('PolicyViolationError class identity', () => {
    const e = new PolicyViolationError('x');
    expect(e).toBeInstanceOf(PolicyViolationError);
    expect(e.name).toBe('PolicyViolationError');
  });

  it('RoundMissingError class identity', () => {
    const e = new RoundMissingError('x');
    expect(e).toBeInstanceOf(RoundMissingError);
    expect(e.name).toBe('RoundMissingError');
  });

  it('WrongBeaconError class identity', () => {
    const e = new WrongBeaconError('x');
    expect(e).toBeInstanceOf(WrongBeaconError);
    expect(e.name).toBe('WrongBeaconError');
  });

  it('AlreadyFulfilledError class identity', () => {
    const e = new AlreadyFulfilledError('x');
    expect(e).toBeInstanceOf(AlreadyFulfilledError);
    expect(e.name).toBe('AlreadyFulfilledError');
  });

  it('TxError class identity', () => {
    const e = new TxError('x');
    expect(e).toBeInstanceOf(TxError);
    expect(e.name).toBe('TxError');
  });
});



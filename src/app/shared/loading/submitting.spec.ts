import { submitting } from './submitting';

/** Отложенный промис для управления моментом завершения действия. */
function deferred(): { promise: Promise<void>; resolve: () => void; reject: (e: unknown) => void } {
  let resolveFn: () => void = () => {};
  let rejectFn: (e: unknown) => void = () => {};
  const promise = new Promise<void>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  return { promise, resolve: resolveFn, reject: rejectFn };
}

describe('submitting — защита от двойной отправки', () => {
  it('busy=true во время действия и false после успеха', async () => {
    const state = submitting();
    const gate = deferred();
    const runPromise = state.run(() => gate.promise);

    expect(state.busy()).toBeTrue();
    gate.resolve();
    await runPromise;
    expect(state.busy()).toBeFalse();
  });

  it('busy сбрасывается и при ошибке действия, исключение пробрасывается', async () => {
    const state = submitting();
    await expectAsync(
      state.run(async () => {
        throw new Error('сбой');
      }),
    ).toBeRejectedWithError('сбой');
    expect(state.busy()).toBeFalse();
  });

  it('повторный вызов во время выполнения игнорируется', async () => {
    const state = submitting();
    const first = deferred();
    let secondRan = false;

    const firstRun = state.run(() => first.promise);
    const secondRun = state.run(async () => {
      secondRan = true;
    });

    expect(state.busy()).toBeTrue();
    await secondRun; // игнорируется — завершается сразу
    expect(secondRan).toBeFalse();

    first.resolve();
    await firstRun;
    expect(state.busy()).toBeFalse();
  });
});

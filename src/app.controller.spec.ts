import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(() => {
    controller = new AppController();
  });

  it('returns health payload', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
  });
});

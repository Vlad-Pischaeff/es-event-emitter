import EventEmitter from '../src/event-emitter.js';
import expect from 'expect';

describe('EventEmitter', function() {
  const EM = new EventEmitter();

  describe('1: Constructor', function() {
    EM.on('foo', () => 'some response');

    it('1.1: _events property should be private', () =>
      expect(EM._events).toEqual(void 0)
    );

    it('1.2: _callbacks property should be private', () =>
      expect(EM._callbacks).toEqual(void 0)
    );

    it('1.3: _maxListeners property should be private', () =>
      expect(EM._maxListeners).toEqual(void 0)
    );

    it('1.4: on method should be public', () =>
      expect(EM.on).toBeInstanceOf(Function)
    );

    it('1.5: once method should be public', () =>
      expect(EM.once).toBeInstanceOf(Function)
    );

    it('1.6: off method should be public', () =>
      expect(EM.off).toBeInstanceOf(Function)
    );

    it('1.7: emit method should be public', () =>
      expect(EM.emit).toBeInstanceOf(Function)
    );
  });

  describe('2: on(), emit()', function() {
    let foo = 2;
    let bar = 1;

    EM.on('bar', () => foo++);
    EM.on('mul', () => bar = 2);
    EM.on('mul', () => foo = 22);

    it('2.1: Initial "foo" should be equal 2', function() {
      expect(foo).toEqual(2);
    });

    it('2.2: After triggering event "bar", "foo" should be equal 3, and 4 after second emit', function() {
      EM.emit('bar');
      expect(foo).toEqual(3);
      EM.emit('bar');
      expect(foo).toEqual(4);
    });

    it('2.3: Triggering one event "bar" cause two actions: "bar" = 2, "foo" = 22 ', function() {
      EM.emit('mul');
      expect(bar).toEqual(2);
      expect(foo).toEqual(22);
    });
  });

  describe('3: once()', function() {
    let foo = 2;

    EM.once('foo', () => foo++);

    it('3.1: After the first triggering event "bar", "foo" should be equal 3', () => {
      EM.emit('foo');
      expect(foo).toEqual(3);
    });

    it('3.2: After the second, third triggering event "bar", "foo" should be equal 3 as well', () => {
      EM
        .emit('foo')
        .emit('foo');
      expect(foo).toEqual(3);
    });
  });

  describe('4: off()', function() {
    let foo = 1;

    EM
      .on('baz', () => foo++)
      .off('baz')
      .emit('baz');

    it('4.1: event "bar" should not be triggered', () =>
      expect(foo).toEqual(1)
    );
  });

  describe('5: listenersNumber()', function() {
    it('5.1: Initial "bar1" should be equal 0', () =>
      expect(EM.listenersNumber('bar1')).toEqual(null)
    );

    it('5.2: After add event listeners "bar1", number of listeners should be 4', () => {
      EM
        .on('bar1', () => 'some response 1')
        .on('bar1', () => 'some response 2')
        .on('bar1', () => 'some response 3')
        .on('bar1', () => 'some response 4');
      expect(EM.listenersNumber('bar1')).toEqual(4);
    });
  });

  describe('6: context applying', function() {
    let User = { name: 'John' };
    let user;
    
    EM.on('setUser', function() { user = this.name }, User);
    EM.emit('setUser');

    it('6.1: After triggering event "user" should be equal John', () => {
      expect(user).toEqual('John');
    });

  });

  describe('7: number of args applying', function() {
    let arg1, arg2;
    
    EM.on('number', (a1, a2) => { arg1 = a1, arg2 = a2 });
    EM.emit('number', 1, 2);

    it('7.1: After triggering event "number" arg1 should be equal 1, arg2 should be equal 2 ', () => {
      expect(arg1).toEqual(1);
      expect(arg2).toEqual(2);
    });

  });
});

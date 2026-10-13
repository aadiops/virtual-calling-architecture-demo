const users = {
  alice: { id: 'alice', role: 'agent' },
  bob: { id: 'bob', role: 'customer' }
};

class AuthService {
  verify(token) {
    return users[token] || null;
  }
}

class RequestValidator {
  validate(body) {
    if (!body || !body.userId || !body.targetId) {
      throw new Error('Invalid request');
    }
    return true;
  }
}

class CallController {
  constructor() {
    this.calls = new Map();
  }

  createCall(userId, targetId) {
    const id = `call-${Date.now()}`;
    this.calls.set(id, { id, userId, targetId, status: 'ringing' });
    return this.calls.get(id);
  }

  acceptCall(callId) {
    const call = this.calls.get(callId);
    if (!call) throw new Error('Call not found');
    call.status = 'connected';
    return call;
  }

  endCall(callId) {
    const call = this.calls.get(callId);
    if (!call) throw new Error('Call not found');
    call.status = 'ended';
    return call;
  }
}

class MediaService {
  connect(call) {
    return { ...call, media: 'webrtc', status: 'media-live' };
  }
}

class NotificationService {
  send(event, payload) {
    return { event, payload, sentAt: new Date().toISOString() };
  }
}

class MessageQueue {
  constructor() {
    this.jobs = [];
  }

  enqueue(job) {
    this.jobs.push(job);
  }

  flush() {
    const jobs = this.jobs.slice();
    this.jobs = [];
    return jobs;
  }
}

class APIGateway {
  constructor() {
    this.auth = new AuthService();
    this.validator = new RequestValidator();
    this.calls = new CallController();
    this.media = new MediaService();
    this.notifications = new NotificationService();
    this.queue = new MessageQueue();
  }

  handleRequest(token, body) {
    const user = this.auth.verify(token);
    if (!user) throw new Error('Unauthorized');

    this.validator.validate(body);

    const call = this.calls.createCall(body.userId, body.targetId);
    const mediaCall = this.media.connect(call);

    this.queue.enqueue({ type: 'call-created', call: mediaCall });

    const notification = this.notifications.send('call-created', {
      userId: body.userId,
      targetId: body.targetId,
      callId: mediaCall.id
    });

    return {
      user,
      call: mediaCall,
      notification,
      queued: this.queue.flush()
    };
  }
}

function main() {
  const gateway = new APIGateway();

  try {
    const result = gateway.handleRequest('alice', {
      userId: 'alice',
      targetId: 'bob'
    });

    console.log('Virtual call request delivered successfully.');
    console.log(JSON.stringify(result, null, 2));

    const connected = gateway.calls.acceptCall(result.call.id);
    console.log('Call connected:', JSON.stringify(connected, null, 2));

    const ended = gateway.calls.endCall(result.call.id);
    console.log('Call ended:', JSON.stringify(ended, null, 2));
  } catch (error) {
    console.error('Gateway error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  APIGateway,
  AuthService,
  CallController,
  MediaService,
  NotificationService,
  MessageQueue,
  RequestValidator
};

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
  constructor() { this.calls = new Map(); }
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

class Queue {
  constructor() { this.jobs = []; }
  enqueue(job) { this.jobs.push(job); }
  flush() { return this.jobs.splice(0); }
}

class APIGateway {
  constructor() {
    this.auth = new AuthService();
    this.validator = new RequestValidator();
    this.calls = new CallController();
    this.media = new MediaService();
    this.notifications = new NotificationService();
    this.queue = new Queue();
  }

  handleRequest(token, body) {
    const user = this.auth.verify(token);
    if (!user) throw new Error('Unauthorized');
    this.validator.validate(body);
    const call = this.calls.createCall(body.userId, body.targetId);
    const mediaCall = this.media.connect(call);
    this.queue.enqueue({ type: 'call-created', call: mediaCall });
    const notification = this.notifications.send('call-created', { userId: body.userId, targetId: body.targetId });
    return { user, call: mediaCall, notification, queued: this.queue.flush() };
  }
}

const gateway = new APIGateway();

try {
  const result = gateway.handleRequest('alice', { userId: 'alice', targetId: 'bob' });
  console.log(JSON.stringify(result, null, 2));
  const connected = gateway.calls.acceptCall(result.call.id);
  console.log('Connected call:', connected);
} catch (error) {
  console.error('Gateway error:', error.message);
}

module.exports = { APIGateway, AuthService, CallController, MediaService, NotificationService };
// Example output for a virtual calling workflow:
// 1. Client sends a request to the API Gateway.
// 2. Auth validates the token and request payload.
// 3. CallController creates a session with ringing status.
// 4. MediaService upgrades the session to media-live.
// 5. NotificationService emits a call-created notification.
// 6. Queue captures the call event for async processing.
// This simple example mirrors a production architecture:
// - API Gateway
// - Auth Service
// - Call Control
// - Media Service
// - Notification Service

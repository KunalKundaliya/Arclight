/**
 * ArcLight - Real-Time Server-Sent Events (SSE) Broadcast Hub
 * Manages active browser client connections and broadcasts live scheduling events.
 */

class EventHub {
  constructor() {
    this.clients = new Set();

    // Send a keep-alive heartbeat every 25 seconds to prevent browser/proxy timeouts
    this.heartbeatTimer = setInterval(() => {
      this.heartbeat();
    }, 25000);

    // Ensure timer doesn't hold the process open during test runs
    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  // Register a new client connection
  addClient(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send immediate confirmation
    res.write(': connected\n\n');

    this.clients.add(res);

    // Clean up when client disconnects or closes tab
    req.on('close', () => {
      this.clients.delete(res);
    });
  }

  // Broadcast an event to all open browser sessions
  broadcast(eventType, payload = {}) {
    const data = JSON.stringify({
      type: eventType,
      payload,
      timestamp: new Date().toISOString()
    });

    const message = `event: ${eventType}\ndata: ${data}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  heartbeat() {
    for (const client of this.clients) {
      try {
        client.write(': heartbeat\n\n');
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const eventHub = new EventHub();

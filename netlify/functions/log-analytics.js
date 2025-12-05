/**
 * Netlify Function: Analytics Logger
 *
 * Receives and logs analytics events from the game.
 * Currently logs to Netlify function logs (visible in Netlify dashboard).
 * Future: Can be extended to send to database (MongoDB, Supabase, etc.)
 */

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const logData = JSON.parse(event.body);

    // Determine if this is a single event or batch
    const isBatch = logData.events && Array.isArray(logData.events);

    if (isBatch) {
      // Batch logging (session summary)
      console.log('[ANALYTICS BATCH]', JSON.stringify({
        sessionId: logData.sessionId,
        sessionStart: new Date(logData.sessionStart).toISOString(),
        sessionEnd: new Date(logData.sessionEnd).toISOString(),
        duration: logData.sessionEnd - logData.sessionStart,
        totalEvents: logData.totalEvents,
        eventTypes: logData.events.map(e => e.type)
      }, null, 2));

      // Log each event in the batch
      logData.events.forEach((event, index) => {
        console.log(`[ANALYTICS EVENT ${index + 1}/${logData.totalEvents}]`, JSON.stringify({
          type: event.type,
          timestamp: new Date(event.timestamp).toISOString(),
          data: event.data
        }, null, 2));
      });
    } else {
      // Single event logging
      console.log('[ANALYTICS EVENT]', JSON.stringify({
        type: logData.type,
        sessionId: logData.sessionId,
        timestamp: new Date(logData.timestamp).toISOString(),
        data: logData.data
      }, null, 2));
    }

    // Future: Send to database
    // await saveToDatabase(logData);
    // Example for MongoDB:
    // const { MongoClient } = require('mongodb');
    // const client = await MongoClient.connect(process.env.MONGODB_URI);
    // const db = client.db('ai-behavior-lab');
    // await db.collection('analytics').insertOne({
    //   ...logData,
    //   receivedAt: new Date()
    // });
    // await client.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Enable CORS
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('[ANALYTICS ERROR]', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Logging failed',
        message: error.message
      })
    };
  }
};

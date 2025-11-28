// Lambda handler for creating an Amazon Chime SDK meeting + attendee.
// Uses AWS SDK v3 for Node.js 18+ compatibility.

const { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } = require("@aws-sdk/client-chime-sdk-meetings");

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const meetingId = body.meetingId || `demo-${Date.now()}`;
    const name = body.name || "Guest";
    const region = body.region || "us-east-1";

    const client = new ChimeSDKMeetingsClient({ region: "us-east-1" });
    const requestToken = `${meetingId}-${Date.now()}`;

    // Create meeting
    const createMeetingCommand = new CreateMeetingCommand({
      ClientRequestToken: requestToken,
      MediaRegion: region,
      ExternalMeetingId: meetingId,
    });

    const meetingResponse = await client.send(createMeetingCommand);

    // Create attendee
    const createAttendeeCommand = new CreateAttendeeCommand({
      MeetingId: meetingResponse.Meeting.MeetingId,
      ExternalUserId: name,
    });

    const attendeeResponse = await client.send(createAttendeeCommand);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        meeting: meetingResponse.Meeting,
        attendee: attendeeResponse.Attendee,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
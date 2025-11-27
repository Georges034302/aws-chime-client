// Basic Lambda handler for creating an Amazon Chime meeting + attendee.
// This assumes the Lambda has permission to call chime:CreateMeeting and chime:CreateAttendee.
// Region must be set according to your deployment.

const AWS = require("aws-sdk");

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const meetingId = body.meetingId || `demo-${Date.now()}`;
    const name = body.name || "Guest";
    const region = body.region || "us-east-1";

    const chime = new AWS.Chime({ region: "us-east-1" });
    chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

    const requestToken = `${meetingId}-${Date.now()}`;

    const meetingResponse = await chime
      .createMeeting({
        ClientRequestToken: requestToken,
        MediaRegion: region,
      })
      .promise();

    const attendeeResponse = await chime
      .createAttendee({
        MeetingId: meetingResponse.Meeting.MeetingId,
        ExternalUserId: name,
      })
      .promise();

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
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
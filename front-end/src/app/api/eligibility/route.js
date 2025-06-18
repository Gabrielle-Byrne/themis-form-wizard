// /src/app/api/eligibility/route.js
import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('eligibility'); 
    // Delete all but latest document
    const recentDocs = await collection.find()
      .sort({ _id: -1 }) 
      .limit(1)
      .toArray();

    const recentIds = recentDocs.map(doc => doc._id);

    await collection.deleteMany({ _id: { $nin: recentIds } });

    const result = await collection.insertOne(body);
    return new Response(JSON.stringify({ success: true, id: result.insertedId }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to insert data' }), { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const data = await db.collection('eligibility').find().sort({ _id: -1}).limit(1).toArray();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { status: 500 });
  }
}

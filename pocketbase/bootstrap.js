import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function bootstrap() {
    try {
        console.log("Authenticating as admin...");
        if (pb.admins) {
            await pb.admins.authWithPassword('admin@example.com', 'adminpassword123');
        } else {
            await pb.collection('_superusers').authWithPassword('admin@example.com', 'adminpassword123');
        }
        console.log("Admin authenticated successfully!");

        const users = await pb.collections.getOne("users");
        console.log("USERS SCHEMA:");
        console.log(JSON.stringify(users, null, 2));

    } catch (err) {
        console.error("Bootstrap failed:", err);
    }
}

bootstrap();

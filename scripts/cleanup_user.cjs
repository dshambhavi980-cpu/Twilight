const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables manually since we are running this as a script
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We need Service Role Key to delete users from auth.users, but for public schema ANON key might work if RLS allows (unlikely for "other" users).
// Let's try to use VITE_SUPABASE_ANON_KEY first, but likely need SERVICE_ROLE_KEY if RLS blocks us.
// The user prompt implies they want to "delete everything", which usually requires admin privileges if the user isn't logged in.
// However, the prompt came from the user who is presumably logged in as *someone*.
// But since I'm running a script, I am not logged in as anyone.
// I will check if there is a SERVICE_ROLE_KEY in .env. If not, I can only delete what public access allows (which is probably nothing).
// WAIT: The user said "from db". I am assuming I have access.
// If I don't have SERVICE_ROLE_KEY, I can try to sign in as the user (if I knew the password) but I don't.
// Let's try with ANON key and hope RLS is permissive or I have a service key.

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAIL = 'adiroyboy2@gmail.com';
// ID found in logs: c81e7363-4ae9-4385-bab1-fb13473ecca0
const TARGET_ID = 'c81e7363-4ae9-4385-bab1-fb13473ecca0'; 

async function deleteUserData() {
    console.log(`Targeting user: ${TARGET_EMAIL} (${TARGET_ID})`);

    // 1. Delete from shared_notes (sender)
    const { error: notesError } = await supabase
        .from('shared_notes')
        .delete()
        .eq('sender_id', TARGET_ID);
    
    if (notesError) console.error('Error deleting shared_notes:', notesError);
    else console.log('Deleted shared_notes');

    // 2. Delete from daily_logs
    const { error: logsError } = await supabase
        .from('daily_logs')
        .delete()
        .eq('user_id', TARGET_ID);

    if (logsError) console.error('Error deleting daily_logs:', logsError);
    else console.log('Deleted daily_logs');

    // 3. Delete from user_settings
    const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', TARGET_ID);
    
    if (settingsError) console.error('Error deleting user_settings:', settingsError);
    else console.log('Deleted user_settings');

    // 4. Delete couples (where partner_1 or partner_2)
    const { error: couplesError1 } = await supabase
        .from('couples')
        .delete()
        .eq('partner_1_id', TARGET_ID);
    
    if (couplesError1) console.error('Error deleting couples (partner_1):', couplesError1);
    else console.log('Deleted couples (partner_1)');

    const { error: couplesError2 } = await supabase
        .from('couples')
        .delete()
        .eq('partner_2_id', TARGET_ID);
    
    if (couplesError2) console.error('Error deleting couples (partner_2):', couplesError2);
    else console.log('Deleted couples (partner_2)');

    // 5. Delete from profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', TARGET_ID);

    if (profileError) console.error('Error deleting profile:', profileError);
    else console.log('Deleted profile');

    // 6. Attempt to delete from auth.users (requires service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(TARGET_ID);
    if (authError) {
        console.error('Error deleting from auth.users (likely need service role):', authError.message);
    } else {
        console.log('Deleted from auth.users');
    }
}

deleteUserData();

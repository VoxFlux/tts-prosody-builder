# Supabase Cloud Sync Setup

This guide will help you set up Supabase for optional cloud sync functionality in the TTS Prosody Builder.

## Why Supabase?

- **Optional**: The app works perfectly without Supabase (localStorage only)
- **Free Tier**: Generous free tier for individual researchers
- **Privacy**: You control your own data
- **Sync**: Access your data from multiple devices
- **Backup**: Automatic cloud backup of your work

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free)
3. Create a new project:
   - Choose a project name (e.g., "tts-prosody-builder")
   - Set a database password (save this securely!)
   - Select a region close to you
   - Wait for the project to be created (~2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (gear)
2. Go to **API** section
3. You'll need two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your project:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Never commit the `.env` file to git (it's already in `.gitignore`)

## Step 4: Set Up the Database Table

1. In your Supabase dashboard, go to the **SQL Editor**
2. Click **New Query**
3. Paste the following SQL and click **Run**:

```sql
-- Create the user_data table
CREATE TABLE user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if table already exists
ALTER TABLE user_data ADD CONSTRAINT user_data_user_id_unique UNIQUE (user_id);

-- Create an index on user_id for faster lookups
CREATE INDEX idx_user_data_user_id ON user_data(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own data
CREATE POLICY "Users can view their own data"
  ON user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own data
CREATE POLICY "Users can insert their own data"
  ON user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own data
CREATE POLICY "Users can update their own data"
  ON user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own data
CREATE POLICY "Users can delete their own data"
  ON user_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Optional: Configure email templates under **Authentication** → **Email Templates**

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Look for the **Sign In** button in the top-right corner
4. Create an account with your email
5. Check your email for the confirmation link
6. Sign in and verify that sync works

## How Cloud Sync Works

### Automatic Sync
- Data syncs automatically when you sign in
- Changes sync in the background every 3 seconds
- Conflict resolution: most recent data wins

### Manual Sync
- Click the refresh icon to sync immediately
- Useful if you made changes on another device

### Offline Mode
- App works completely offline
- Data stored in browser localStorage
- Syncs when you come back online

## Security & Privacy

- **Row Level Security (RLS)**: Users can only access their own data
- **No data sharing**: Your data is private and not shared with anyone
- **Encryption**: Data is encrypted in transit (HTTPS)
- **Local-first**: App works without internet, sync is optional

## Troubleshooting

### "Sign in button doesn't appear"
- Check that your `.env` file has the correct credentials
- Restart the dev server after creating `.env`

### "Failed to sync"
- Check your internet connection
- Verify your Supabase project is active (free tier doesn't expire)
- Check browser console for error messages

### "Can't sign in"
- Make sure you confirmed your email
- Check spam folder for confirmation email
- Try resetting password

### "Data not syncing between devices"
- Make sure you're signed in on both devices
- Click the manual sync button
- Check that you're using the same account

## Deployment Considerations

For production deployment (e.g., GitHub Pages):

1. **GitHub Actions**: Add secrets for environment variables
   - Go to repository Settings → Secrets and variables → Actions
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **Update workflow** (.github/workflows/deploy.yml):
   ```yaml
   - name: Build
     run: npm run build
     env:
       VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
       VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
   ```

## Cost

- **Free tier**: Up to 500MB database, 50,000 monthly active users
- **Paid tier**: Starts at $25/month for more resources
- For individual research use, free tier is typically sufficient

## Support

- Supabase docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- For issues with this integration, open a GitHub issue

---

**Note**: Cloud sync is completely optional. The app works perfectly without Supabase using only localStorage.

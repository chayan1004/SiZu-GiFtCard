echo "🔄 Starting safe dependency updates..."
npm install @tanstack/react-query@5.83.0 @playwright/test@1.54.1 playwright@1.54.1 drizzle-orm@0.44.2 drizzle-kit@0.31.4
echo "✅ Safe updates completed"
echo "🧪 Testing application..."
npm run check
echo "📊 Running security audit..."
npm audit --audit-level=high || true
echo "🎉 Update process completed"

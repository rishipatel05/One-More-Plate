import { useApp } from '../lib/store';
import { Eyebrow, Chip } from './UI';
import type { FoodPost } from '../types';

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function FeedCard({ post }: { post: FoodPost }) {
  const { claimPost, showToast } = useApp();

  const handleClaim = () => {
    claimPost(post.id);
    showToast('Run claimed! Check your WhatsApp.');
  };

  return (
    <div className={`feed-card ${post.claimed ? 'claimed' : ''}`}>
      <div className="feed-top">
        <div className="feed-name">{post.restaurantName}</div>
        <div className="feed-ago">{timeAgo(post.postedAt)}</div>
      </div>
      <div className="feed-food">{post.foodDescription}</div>
      <div className="feed-chips">
        <Chip>{post.portions} portions</Chip>
        <Chip variant={post.condition === 'hot' ? 'hot' : 'default'}>
          {post.condition === 'hot' ? '🔥 Hot' : post.condition === 'warm' ? '♨️ Warm' : '❄️ Cold'}
        </Chip>
        <Chip variant="urgent">⏰ By {post.pickupBy}</Chip>
      </div>
      {post.geminiSummary && (
        <div style={{ fontSize: 12, color: 'var(--warm-grey)', marginBottom: 10, fontStyle: 'italic', lineHeight: 1.4 }}>
          🌱 {post.geminiSummary.distributionRecommendation}
        </div>
      )}
      <button
        className={`claim-btn ${post.claimed ? 'taken' : ''}`}
        onClick={!post.claimed ? handleClaim : undefined}
      >
        {post.claimed ? `✓ Claimed${post.claimedBy ? ` by ${post.claimedBy}` : ''}` : 'Claim this pickup →'}
      </button>
    </div>
  );
}

export default function FeedTab() {
  const { posts } = useApp();
  const available = posts.filter(p => !p.claimed).length;

  return (
    <div className="body">
      <Eyebrow>Open pickups near Newark, DE · {available} available</Eyebrow>
      {posts.length === 0 ? (
        <div className="empty">No pickups right now.<br />Check back at closing time.</div>
      ) : (
        posts.map(post => <FeedCard key={post.id} post={post} />)
      )}
    </div>
  );
}

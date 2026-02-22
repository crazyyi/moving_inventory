'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api-client';
import { useAPICall } from '@/lib/hooks';
import { History, AlertCircle, ChevronDown } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

interface RecentActivitiesProps {
  inventoryId: string;
  lastViewedAt?: Date | null;
  onUnreadCount?: (count: number) => void;
}

// Helper to format relative time (e.g., "2 hours ago", "just now")
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Human-readable labels for known field names
const FIELD_NAME_MAP: Record<string, string> = {
  moveDate: 'Move Date',
  customerName: 'Customer Name',
  customerEmail: 'Email',
  customerPhone: 'Phone Number',
  fromAddress: 'From Address',
  toAddress: 'To Address',
  notes: 'Notes',
  quantity: 'Quantity',
  photos: 'Photos',
};

function humanizeField(field: string): string {
  return (
    FIELD_NAME_MAP[field] ||
    field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
  );
}

function formatValue(value: string): string {
  // Detect ISO date strings (e.g. "2026-03-15T...") and format nicely
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // fall through
    }
  }
  return value;
}

// Helper to get a human-readable action description with details
function getActionDescription(log: AuditLog): {
  title: string;
  description?: string;
  details?: string[];
} {
  const payload = log.payload as Record<string, unknown> | undefined;
  const changes = payload?.changes as Record<string, { old: unknown; new: unknown }> | undefined;

  const actionMap: Record<
    string,
    {
      title: string;
      getDescription?: (payload?: Record<string, unknown>) => string;
      getDetails?: (payload?: Record<string, unknown>) => string[];
    }
  > = {
    inventory_created: {
      title: 'Inventory Created',
      getDescription: () => 'New inventory started',
    },
    inventory_updated: {
      title: 'Inventory Updated',
      getDescription: () => {
        if (!changes) return 'Information updated';
        const fields = Object.keys(changes);
        if (fields.length === 1) {
          const field = fields[0];
          const fieldName = humanizeField(field);
          const newVal = formatValue(String(changes[field]?.new ?? 'empty'));
          return `${fieldName} set to: ${newVal}`;
        }
        const fieldNames = fields.map(humanizeField).join(', ');
        return `Updated: ${fieldNames}`;
      },
      getDetails: () => {
        if (!changes) return [];
        return Object.entries(changes).map(([field, change]) => {
          const fieldName = humanizeField(field);
          const oldVal = formatValue(change?.old ? String(change.old) : '(empty)');
          const newVal = formatValue(change?.new ? String(change.new) : '(empty)');
          return `${fieldName}: ${oldVal} → ${newVal}`;
        });
      },
    },
    inventory_submitted: {
      title: 'Inventory Submitted',
      getDescription: (payload) => {
        if (payload?.totalItems) {
          const n = Number(payload.totalItems);
          return `Submitted with ${n} item${n !== 1 ? 's' : ''} for review`;
        }
        return 'Customer submitted inventory for review';
      },
      getDetails: (payload) => {
        const details: string[] = [];
        if (payload?.moveDate) {
          const moveDate = new Date(payload.moveDate as string);
          details.push(
            `Move Date: ${moveDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          );
        }
        if (payload?.fromAddress) details.push(`From: ${payload.fromAddress}`);
        if (payload?.toAddress) details.push(`To: ${payload.toAddress}`);
        if (payload?.totalItems) details.push(`Total Items: ${payload.totalItems}`);
        if (payload?.totalCuFt) details.push(`Volume: ${payload.totalCuFt} cu ft`);
        if (payload?.totalWeight) details.push(`Weight: ${payload.totalWeight} lbs`);
        return details;
      },
    },
    inventory_locked: {
      title: 'Inventory Locked',
      getDescription: () => 'Admin locked inventory — no further changes allowed',
    },
    room_created: {
      title: 'Room Added',
      getDescription: (payload) => {
        const roomName = (payload?.roomName as string) || 'Room';
        return `Added room: ${roomName}`;
      },
    },
    room_deleted: {
      title: 'Room Removed',
      getDescription: (payload) => {
        const roomName = (payload?.roomName as string) || 'Room';
        return `Removed room: ${roomName}`;
      },
    },
    item_created: {
      title: 'Item Added',
      getDescription: (payload) => {
        const itemName = (payload?.itemName as string) || 'Item';
        const qty = (payload?.quantity as number) || 1;
        const roomName = payload?.roomName as string | undefined;
        const base = `Added "${itemName}" × ${qty}`;
        return roomName ? `${base} in ${roomName}` : base;
      },
      getDetails: (payload) => {
        const details: string[] = [];
        if (payload?.roomName) details.push(`Room: ${payload.roomName}`);
        if (payload?.category) details.push(`Category: ${payload.category}`);
        if (payload?.hasPhotos) details.push('Added with photos');
        return details;
      },
    },
    item_updated: {
      title: 'Item Updated',
      getDescription: (payload) => {
        const itemName = (payload?.itemName as string) || 'Item';
        const roomName = payload?.roomName as string | undefined;
        if (changes) {
          const fields = Object.keys(changes);
          if (fields.length === 1) {
            const field = fields[0];
            const fieldName = humanizeField(field);
            const newVal = formatValue(String(changes[field]?.new ?? ''));
            const base = `"${itemName}": ${fieldName} → ${newVal}`;
            return roomName ? `${base} (${roomName})` : base;
          }
        }
        const base = `Updated "${itemName}"`;
        return roomName ? `${base} in ${roomName}` : base;
      },
      getDetails: () => {
        if (!changes) return [];
        return Object.entries(changes).map(([field, change]) => {
          const fieldName = humanizeField(field);
          const oldVal = formatValue(change?.old ? String(change.old) : '(empty)');
          const newVal = formatValue(change?.new ? String(change.new) : '(empty)');
          return `${fieldName}: ${oldVal} → ${newVal}`;
        });
      },
    },
    item_deleted: {
      title: 'Item Removed',
      getDescription: (payload) => {
        const itemName = (payload?.itemName as string) || 'Item';
        const roomName = payload?.roomName as string | undefined;
        const base = `Removed "${itemName}"`;
        return roomName ? `${base} from ${roomName}` : base;
      },
    },
  };

  const actionInfo = actionMap[log.action];
  if (actionInfo) {
    return {
      title: actionInfo.title,
      description: actionInfo.getDescription?.(payload),
      details: actionInfo.getDetails?.(payload),
    };
  }

  // Fallback for unknown actions
  return {
    title: log.action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: log.actor === 'customer' ? 'Customer action' : 'Admin action',
  };
}

export default function RecentActivities({
  inventoryId,
  lastViewedAt,
  onUnreadCount,
}: RecentActivitiesProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const callAPI = useAPICall();

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const result = await callAPI(() => adminAPI.getAuditLogs(inventoryId, 20));
        if (result?.data?.data) {
          const fetched: AuditLog[] = result.data.data;
          setLogs(fetched);
          // Compute unread count and report to parent
          if (onUnreadCount) {
            const unread = lastViewedAt
              ? fetched.filter((l) => new Date(l.createdAt) > lastViewedAt).length
              : 0; // no prior visit — nothing is "unread" yet
            onUnreadCount(unread);
          }
        }
      } catch (err) {
        setError('Failed to load activity log');
        console.error('Error loading audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [inventoryId, callAPI, lastViewedAt, onUnreadCount]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
        </div>
        <p className="text-gray-500 text-sm">Loading activity log...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">No activities recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => {
            const actionInfo = getActionDescription(log);
            const logDate = new Date(log.createdAt);
            const relativeTime = getRelativeTime(logDate);
            const absoluteTime = logDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            const isExpanded = expandedId === log.id;
            const hasDetails = actionInfo.details && actionInfo.details.length > 0;
            const isNew = lastViewedAt ? logDate > lastViewedAt : false;

            // Inject section headers between new and old entries
            const prevLog = index > 0 ? logs[index - 1] : null;
            const prevIsNew = prevLog
              ? (lastViewedAt ? new Date(prevLog.createdAt) > lastViewedAt : false)
              : false;
            const showNewHeader = isNew && index === 0 && lastViewedAt;
            const showOlderDivider = !isNew && prevIsNew;

            return (
              <div key={log.id}>
                {showNewHeader && (
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                    New since last visit
                  </p>
                )}
                {showOlderDivider && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Earlier</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>
                )}
                <div
                  className={`border rounded-lg p-4 transition-colors ${isNew
                      ? 'border-indigo-400 bg-indigo-50 hover:bg-indigo-100'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {actionInfo.title}
                        </p>
                        {isNew && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-indigo-600 text-white uppercase tracking-wide">
                            New
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {log.actor === 'customer' ? 'Customer' : 'Admin'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        {actionInfo.description}
                      </p>
                      <p
                        className="text-xs text-gray-500 cursor-help"
                        title={absoluteTime}
                      >
                        {relativeTime}
                      </p>
                    </div>

                    {hasDetails && (
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : log.id)
                        }
                        className="shrink-0 p-1.5 hover:bg-indigo-100 rounded transition-colors"
                        title="Show details"
                      >
                        <ChevronDown
                          className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Expandable Details */}
                  {hasDetails && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {actionInfo.details?.map((detail, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded"
                        >
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

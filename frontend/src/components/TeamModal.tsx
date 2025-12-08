import { Modal } from 'react-bootstrap';
import { User } from '../types/scheduler';
import UserAvatar from './UserAvatar';

interface TeamModalProps {
  show: boolean;
  onHide: () => void;
  users: User[];
  loading?: boolean;
}

function TeamModal({ show, onHide, users, loading = false }: TeamModalProps) {
  const admins = users.filter((u) => u.role === 'admin');
  const workers = users.filter((u) => u.role === 'user');

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header
        closeButton
        style={{
          borderBottom: '1px solid var(--ms-border, #E5E7EB)',
          background: 'var(--ms-card-bg, #ffffff)',
        }}
      >
        <Modal.Title
          style={{
            fontWeight: 700,
            color: 'var(--ms-text-primary, #111827)',
            fontSize: '1.25rem',
          }}
        >
          Team Members
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{
          background: 'var(--ms-bg, #F8FAFC)',
          padding: '24px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '48px',
            }}
          >
            <div className="ms-spinner" />
          </div>
        ) : (
          <>
            {/* Administrators Section */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #002169 0%, #1E40AF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M12 15l-2-2m0 0l2-2m-2 2h4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <circle cx="12" cy="8" r="3" />
                  </svg>
                </div>
                <h5
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    color: 'var(--ms-text-primary, #111827)',
                    fontSize: '1rem',
                  }}
                >
                  Administrators
                </h5>
                <span
                  style={{
                    background: 'var(--ms-primary, #002169)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 10px',
                    borderRadius: '12px',
                  }}
                >
                  {admins.length}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '12px',
                }}
              >
                {admins.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      background: 'var(--ms-card-bg, #ffffff)',
                      borderRadius: '12px',
                      color: 'var(--ms-text-muted, #6B7280)',
                      textAlign: 'center',
                    }}
                  >
                    No administrators found
                  </div>
                ) : (
                  admins.map((admin) => (
                    <div
                      key={admin.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: 'var(--ms-card-bg, #ffffff)',
                        borderRadius: '12px',
                        border: '1px solid var(--ms-border, #E5E7EB)',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      <UserAvatar
                        name={admin.name}
                        email={admin.email}
                        userId={admin.id}
                        profilePhotoUrl={admin.profile_picture_url || undefined}
                        size="md"
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--ms-text-primary, #111827)',
                            marginBottom: '2px',
                          }}
                        >
                          {admin.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--ms-text-muted, #6B7280)',
                          }}
                        >
                          {admin.email}
                        </div>
                      </div>
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #002169 0%, #1E40AF 100%)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: '16px',
                        }}
                      >
                        Admin
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Workers Section */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h5
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    color: 'var(--ms-text-primary, #111827)',
                    fontSize: '1rem',
                  }}
                >
                  Workers
                </h5>
                <span
                  style={{
                    background: '#059669',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 10px',
                    borderRadius: '12px',
                  }}
                >
                  {workers.length}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '12px',
                }}
              >
                {workers.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      background: 'var(--ms-card-bg, #ffffff)',
                      borderRadius: '12px',
                      color: 'var(--ms-text-muted, #6B7280)',
                      textAlign: 'center',
                    }}
                  >
                    No workers found
                  </div>
                ) : (
                  workers.map((worker) => (
                    <div
                      key={worker.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: 'var(--ms-card-bg, #ffffff)',
                        borderRadius: '12px',
                        border: '1px solid var(--ms-border, #E5E7EB)',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      <UserAvatar
                        name={worker.name}
                        email={worker.email}
                        userId={worker.id}
                        profilePhotoUrl={worker.profile_picture_url || undefined}
                        size="md"
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--ms-text-primary, #111827)',
                            marginBottom: '2px',
                          }}
                        >
                          {worker.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--ms-text-muted, #6B7280)',
                          }}
                        >
                          {worker.email}
                          {worker.class_year && (
                            <span style={{ marginLeft: '8px' }}>
                              • Class of {worker.class_year}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: '16px',
                        }}
                      >
                        Worker
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default TeamModal;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Tag, CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { apiFetch, ApiError } from '../../services/api';
import './Checkout.css';

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PAYMENTS_AVAILABLE = import.meta.env.DEV;

export const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discountType, value, subtotal, discount, total }
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(null); // order object on success
  const [purchaseError, setPurchaseError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/courses/${id}/`)
      .then(c => { if (!cancelled) setCourse(c); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const subtotal = course ? Number(course.price || 0) : 0;
  const discount = coupon ? Number(coupon.discount) : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) { setCouponError('Enter a coupon code.'); return; }
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const result = await apiFetch('/coupons/validate/', {
        method: 'POST',
        body: { code, courseId: Number(id) },
      });
      setCoupon(result);
      setCouponCode('');
    } catch (err) {
      setCoupon(null);
      setCouponError(err instanceof ApiError ? err.message : 'Coupon is invalid.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
  };

  const completePurchase = async () => {
    setProcessing(true);
    setPurchaseError('');
    try {
      const order = await apiFetch('/orders/', {
        method: 'POST',
        body: {
          courseId: Number(id),
          couponCode: coupon ? coupon.code : '',
        },
      });
      setComplete(order);
    } catch (err) {
      setPurchaseError(err instanceof ApiError ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="checkout-page"><p className="body-md">Loading checkout...</p></div>;
  }

  if (!PAYMENTS_AVAILABLE) {
    return (
      <div className="checkout-page">
        <Card className="checkout-success-card">
          <h1 className="headline-md" style={{ marginBottom: 'var(--spacing-sm)' }}>Paid checkout unavailable</h1>
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-xl)' }}>
            Paid courses are temporarily unavailable until a verified payment provider is configured.
          </p>
          <Button variant="primary" onClick={() => navigate(`/course/${id}`)}>Back to Course</Button>
        </Card>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="checkout-page">
        <Card className="checkout-success-card">
          <CheckCircle size={64} color="var(--color-primary)" style={{ margin: '0 auto var(--spacing-lg)' }} />
          <h1 className="headline-md" style={{ marginBottom: 'var(--spacing-sm)' }}>Payment Successful</h1>
          <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-xl)' }}>
            You are now enrolled in <strong>{complete.courseTitle}</strong>.
          </p>
          <div className="order-summary">
            <div className="summary-row"><span>Subtotal</span><span>{money(complete.subtotal)}</span></div>
            {Number(complete.discount) > 0 && (
              <div className="summary-row discount"><span>Coupon {complete.couponCode}</span><span>-{money(complete.discount)}</span></div>
            )}
            <div className="summary-row total"><span>Total Paid</span><span>{money(complete.total)}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
            <Button variant="primary" style={{ flex: 1 }} onClick={() => navigate(`/student/course/${id}/video`)}>
              Start Learning
            </Button>
            <Button variant="ghost" style={{ flex: 1 }} onClick={() => navigate('/student/orders')}>
              View Orders
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="checkout-page">
        <h2 className="headline-md">Checkout unavailable</h2>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-sm)' }}>{error || 'This course may be unavailable.'}</p>
        <Link to="/catalog"><Button variant="primary" style={{ marginTop: 'var(--spacing-md)' }}>Back to Catalog</Button></Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Button variant="ghost" onClick={() => navigate(`/course/${course.id}`)} style={{ marginBottom: 'var(--spacing-md)' }}>
        <ChevronLeft size={18} /> Back to Course
      </Button>

      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <p className="label-sm" style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>Secure Checkout</p>
        <h1 className="headline-lg">{course.title}</h1>
        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--spacing-xs)' }}>
          by {course.instructorName} · {course.sections.length} sections
        </p>
      </div>

      <div className="checkout-layout">
        <div style={{ flex: '1 1 320px' }}>
          <Card className="p-xl">
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Order Summary</h2>

            <div className="order-summary">
              <div className="summary-row">
                <span>Course price</span>
                <span>{money(subtotal)}</span>
              </div>

              {coupon ? (
                <div className="summary-row discount">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={14} /> Coupon <Badge variant="primary">{coupon.code}</Badge>
                    <button onClick={removeCoupon} className="icon-btn" style={{ width: '20px', height: '20px', background: 'none', border: 'none', cursor: 'pointer' }} title="Remove coupon">
                      <X size={14} />
                    </button>
                  </span>
                  <span>-{money(discount)}</span>
                </div>
              ) : (
                <div className="summary-row" style={{ color: 'var(--color-on-surface-variant)' }}>
                  <span>Coupon discount</span><span>Apply a code below</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              {coupon && (
                <p className="label-sm" style={{ color: 'var(--color-primary)', marginTop: '2px' }}>
                  You saved {money(discount)}!
                </p>
              )}
            </div>

            <div className="coupon-box" style={{ marginTop: 'var(--spacing-xl)' }}>
              <label className="label-sm" style={{ display: 'block', marginBottom: '6px' }}>Promo Code</label>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <Input
                  placeholder="e.g. SAVE20"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                />
                <Button variant="secondary" onClick={applyCoupon} disabled={applyingCoupon || !!coupon}>
                  {applyingCoupon ? 'Applying...' : 'Apply'}
                </Button>
              </div>
              {couponError && <p className="body-sm" style={{ color: '#B91C1C', marginTop: 'var(--spacing-sm)' }}>{couponError}</p>}
            </div>
          </Card>
        </div>

        <div style={{ flex: '1 1 320px' }}>
          <Card className="p-xl">
            <h2 className="title-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>Payment</h2>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--spacing-lg)' }}>
              This is a demo checkout — no real payment is processed.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface-container-low)', marginBottom: 'var(--spacing-lg)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
              <span className="body-sm">Test card data is simulated locally.</span>
            </div>

            {purchaseError && <p className="body-sm" style={{ color: '#B91C1C', marginBottom: 'var(--spacing-sm)' }}>{purchaseError}</p>}

            <Button variant="primary" style={{ width: '100%' }} onClick={completePurchase} disabled={processing}>
              {processing ? <><Loader2 size={16} className="spin" /> Processing...</> : `Pay ${money(total)}`}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
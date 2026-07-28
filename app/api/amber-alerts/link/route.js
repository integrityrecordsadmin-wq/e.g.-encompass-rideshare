import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: { message: 'accountId is required' } },
        { status: 400 }
      );
    }

    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['recipient'],
          refresh_url: `${process.env.NEXT_PUBLIC_DOMAIN}/driver/payout-setup`,
          return_url: `${process.env.NEXT_PUBLIC_DOMAIN}/driver?payoutSetup=complete`,
        },
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe account link creation failed:', error.message);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}

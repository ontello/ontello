import React from 'react';
import { Box, Button, Icon, Icons, Text, config, toRem } from 'folds';
import { Page, PageHero, PageHeroSection } from '../../components/page';
import OntelloSVG from '../../../../public/res/svg/ontello.svg';
import cons from '../../../client/state/cons';

export function WelcomePage() {
  return (
    <Page>
      <Box
        grow="Yes"
        style={{ padding: config.space.S400, paddingBottom: config.space.S700 }}
        alignItems="Center"
        justifyContent="Center"
      >
        <PageHeroSection>
          <PageHero
            icon={<img width="70" height="70" src={OntelloSVG} alt="Ontello Logo" />}
            title="Welcome to Ontello"
            subTitle={
              <span>
                Say it. Send it. Own it.{' '}
                <a
                  href="https://github.com/ontello/ontello/releases"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  v{cons.version}
                </a>
              </span>
            }
          >
            <Box justifyContent="Center">
              <Box grow="Yes" style={{ maxWidth: toRem(300) }} direction="Column" gap="300">
                {/* <Button
                  as="a"
                  href="https://github.com/cinnyapp/cinny"
                  target="_blank"
                  rel="noreferrer noopener"
                  before={<Icon size="200" src={Icons.Code} />}
                >
                  <Text as="span" size="B400" truncate>
                    Source Code
                  </Text>
                </Button> */}
                {/* <Button
                  as="a"
                  href="https://cinny.in/#sponsor"
                  target="_blank"
                  rel="noreferrer noopener"
                  fill="Soft"
                  before={<Icon size="200" src={Icons.Heart} />}
                >
                  <Text as="span" size="B400" truncate>
                    Support
                  </Text>
                </Button> */}
              </Box>
            </Box>
          </PageHero>
        </PageHeroSection>
      </Box>
    </Page>
  );
}

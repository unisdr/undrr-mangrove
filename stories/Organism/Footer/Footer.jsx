import { Container } from "../../Atom/Layout/Container/Container";
import { Icons } from "../../Atom/Icons/Icons";

export function Footer() {
    return (
        <footer>
            <div className="mg-undrr-footer">
                <Container>
                    <div className="mg-undrr-footer__container">
                        <div>
                            <div>
                                <h3>Stay in touch</h3>
                                <ul className="mg-undrr-footer__social-media-links">
                                    <li>
                                        <a href="https://www.facebook.com/unisdr" target="_blank" aria-label="Go to UNDRR Facebook profile">
                                          <img src="icons/facebook-white.svg" alt="" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://www.linkedin.com/company/undrr/" target="_blank" aria-label="Go to UNDRR LinkedIn profile">
                                          <img src="icons/linkedin-white.svg" alt="" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://www.x.com/undrr" target="_blank" aria-label="Go to UNDRR X profile">
                                          <img src="icons/x.svg" alt="" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://www.flickr.com/photos/isdr" target="_blank" aria-label="Go to UNDRR Flickr profile">
                                          <img src="icons/flickr-white.svg" alt="" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://www.youtube.com/UNISDR" target="_blank" aria-label="Go to UNDRR YouTube profile">
                                          <img src="icons/youtube-white.svg" alt="" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://www.preventionweb.net/rss.xml" target="_blank" aria-label="Go to UNDRR RSS feed">
                                          <img src="icons/rss-white.svg" alt="" />
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <a className="btn" href="https://www.undrr.org/subscribe-undrr-updates">
                                    Sign up for UNDRR updates
                                </a>
                            </div>
                        </div>

                        <div>
                            <h3>Quicklinks</h3>

                            <ul class="menu nav">
                                <li>
                                    <a href="/knowledge-base/latest-additions">
                                        Latest additions
                                    </a>
                                </li>
                                <li>
                                    <a href="/understanding-disaster-risk">
                                        Understanding disaster risks
                                    </a>
                                </li>
                                <li>
                                    <a href="/knowledge-base/type-content/news-announcements">
                                        Knowledge base: hazards, themes &amp; countries
                                    </a>
                                </li>
                                <li>
                                    <a href="/community/community-announcement">
                                        Community announcements
                                    </a>
                                </li>
                                <li>
                                    <a href="/sendai-framework/sendai-framework-for-disaster-risk-reduction">
                                        Sendai Framework
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3>Share your content</h3>

                            <ul class="menu nav">
                                <li>
                                    <a href="https://preventionweb.net/upload-your-content">
                                        Submit your content (articles,
                                        publications, events, jobs, etc.)
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.preventionweb.net/contact">
                                        Blog pitches
                                    </a>
                                </li>
                                <li>
                                    <a href="/upload-your-content/content-submission-policy">
                                        Submission and publishing policy
                                    </a>
                                </li>
                                <li class="last">
                                    <a href="/about-preventionweb">
                                        About PreventionWeb
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <a class="btn" href="/contact">
                                Contact us
                            </a>
                        </div>
                    </div>
                </Container>
            </div>
        </footer>
    );
}

// export default Footer;

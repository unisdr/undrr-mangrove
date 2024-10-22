import React from "react";

// Import your components
import Header from "../../Organism/Header/Header";
import { Footer } from "../../Organism/Footer/Footer";
import { Container } from "../../Atom/Layout/Container/Container";

// Define the Page Template Example component
const PageTemplateDts = () => {
    return (
        <div className="dts-page-container">
            <Header />
            <main className="dts-main-container">
                <section>
                    <Container>page component 1 here</Container>
                </section>
                <section>
                    <Container>page component 2 here</Container>
                </section>
            </main>
            <Footer />
        </div>
    );
};

// Define the default export for the story
export default {
    title: "Page Template Example",
    component: PageTemplateDts,
};

// Define the story
export const Default = () => <PageTemplateDts />;

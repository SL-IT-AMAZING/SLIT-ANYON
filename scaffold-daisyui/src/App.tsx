import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardActions, CardBody, CardTitle } from "@/components/ui/card";
import {
  Collapse,
  CollapseContent,
  CollapseTitle,
} from "@/components/ui/collapse";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import {
  Navbar,
  NavbarCenter,
  NavbarEnd,
  NavbarStart,
} from "@/components/ui/navbar";
import { Progress } from "@/components/ui/progress";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

function Index() {
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar className="shadow-lg bg-base-100">
        <NavbarStart>
          <a className="btn btn-ghost text-xl">DaisyUI App</a>
        </NavbarStart>
        <NavbarCenter className="hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <a>About</a>
            </li>
            <li>
              <a>Contact</a>
            </li>
          </ul>
        </NavbarCenter>
        <NavbarEnd>
          <Button variant="primary" size="sm">
            Get Started
          </Button>
        </NavbarEnd>
      </Navbar>

      <div className="container mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Welcome to DaisyUI</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            A beautiful component library built on Tailwind CSS. Start building
            your app with pre-built, customizable components.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardBody>
              <CardTitle>
                Buttons
                <Badge variant="primary">New</Badge>
              </CardTitle>
              <p>Multiple variants and sizes for every use case.</p>
              <CardActions>
                <Button variant="primary" size="sm">
                  Primary
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary
                </Button>
                <Button variant="accent" size="sm">
                  Accent
                </Button>
              </CardActions>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Form Inputs</CardTitle>
              <p>Clean and accessible form controls.</p>
              <div className="space-y-2 mt-2">
                <Input placeholder="Type something..." />
                <div className="flex items-center gap-2">
                  <Toggle variant="primary" defaultChecked />
                  <span className="text-sm">Enable notifications</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Feedback</CardTitle>
              <div className="space-y-2">
                <Alert variant="info">
                  <span>New update available!</span>
                </Alert>
                <Alert variant="success">
                  <span>Operation successful!</span>
                </Alert>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardBody>
              <CardTitle>Progress & Loading</CardTitle>
              <div className="space-y-4">
                <Progress variant="primary" value={70} max={100} />
                <Progress variant="secondary" value={40} max={100} />
                <div className="flex gap-4 items-center">
                  <Loading variant="spinner" size="md" />
                  <Loading variant="dots" size="md" />
                  <Loading variant="ring" size="md" />
                  <Loading variant="ball" size="md" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Badges & Tooltips</CardTitle>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
              </div>
              <div className="flex gap-4">
                <Tooltip tip="Top tooltip" position="top">
                  <Button variant="ghost" size="sm">
                    Top
                  </Button>
                </Tooltip>
                <Tooltip tip="Bottom tooltip" position="bottom">
                  <Button variant="ghost" size="sm">
                    Bottom
                  </Button>
                </Tooltip>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-12">
          <CardBody>
            <CardTitle>Collapsible Sections</CardTitle>
            <div className="space-y-2">
              <Collapse variant="arrow">
                <CollapseTitle>What is DaisyUI?</CollapseTitle>
                <CollapseContent>
                  <p>
                    DaisyUI is a component library for Tailwind CSS that
                    provides semantic class names for common UI components.
                  </p>
                </CollapseContent>
              </Collapse>
              <Collapse variant="arrow">
                <CollapseTitle>How do I use themes?</CollapseTitle>
                <CollapseContent>
                  <p>
                    Add the data-theme attribute to your HTML element. DaisyUI
                    comes with 30+ built-in themes.
                  </p>
                </CollapseContent>
              </Collapse>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <Card>
        <CardBody className="text-center">
          <CardTitle className="justify-center text-4xl">404</CardTitle>
          <p>Page not found</p>
          <CardActions className="justify-center mt-4">
            <Link to="/">
              <Button variant="primary">Go Home</Button>
            </Link>
          </CardActions>
        </CardBody>
      </Card>
    </div>
  );
}

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;

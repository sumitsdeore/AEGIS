# 🛡️ Aegis Engineering Handbook

> **Tagline:** Predict the impact before you change code.

---

# Executive Summary

## Introduction

Aegis is a Visual Studio Code (VS Code) extension that helps developers understand the impact of their code changes before they modify or refactor a Spring Boot application.

When developers work on small projects, understanding the codebase is usually simple. However, in large enterprise applications, a single project may contain thousands of Java files, hundreds of APIs, multiple services, repositories, configurations, scheduled jobs, and database interactions.

In such applications, changing one class or one method can unintentionally affect many other parts of the system. Developers often spend a significant amount of time manually exploring the project to understand these dependencies before making even a small change.

Aegis was created to solve this problem.

Instead of manually searching through hundreds of files, Aegis automatically analyzes the project's source code, understands how different components are connected, and predicts which parts of the application may be affected by a code change.

The extension performs **Static Code Analysis**, meaning it analyzes the source code without running the application. It parses Java source files, builds a dependency graph of the entire project, and then uses graph traversal algorithms to determine the impact of a selected class or component.

The goal of Aegis is not to replace the developer's decision-making process. Instead, it provides useful insights that help developers make safer and more confident refactoring decisions.

---

# What Problem Does Aegis Solve?

Imagine you have joined a new company.

On your first day, your manager asks you to modify a class called `PaymentService`.

Before making any changes, you naturally start asking questions such as:

- Which APIs use this service?
- Which other services depend on it?
- Which repositories are connected to it?
- If I modify this class, what else could be affected?
- Is it safe to refactor this class?
- Which test cases should I execute after making changes?

Finding answers to these questions usually requires manually reading many files and understanding the entire project structure.

This process is time-consuming and becomes even more difficult as the project grows.

Aegis automates this process by analyzing the project and generating an impact report that helps developers understand the consequences of a code change before they make it.

---

# How Does Aegis Solve This Problem?

Aegis follows a simple workflow.

1. The developer opens a Spring Boot project in VS Code.
2. Aegis scans all Java source files.
3. Each Java file is parsed using JavaParser.
4. JavaParser converts the source code into an Abstract Syntax Tree (AST).
5. Aegis extracts important information such as classes, methods, interfaces, annotations, and dependencies.
6. Using this information, Aegis builds a dependency graph representing the relationships between different components of the application.
7. When the developer selects a class and requests an impact analysis, Aegis traverses the dependency graph.
8. Finally, the extension generates an impact report showing the components that could be affected by the change.

---

# Main Features

The current version of Aegis focuses on the following features:

- Static code analysis
- Java source code parsing using JavaParser
- Dependency graph generation
- Impact prediction
- Risk score calculation
- Interactive dependency visualization
- Spring Boot project analysis

Future versions will include additional features such as Git integration, architecture analysis, dead code detection, security analysis, and AI-powered explanations.

---

# Technologies Used

The project is built using the following technologies:

| Technology | Purpose |
|------------|---------|
| Java 21 | Analyzer Engine |
| JavaParser | Parsing Java source code |
| TypeScript | VS Code Extension Development |
| VS Code Extension API | Integrating with VS Code |
| React | Interactive user interface |
| React Flow | Dependency graph visualization |
| Maven | Dependency management and project build |

---

# Target Users

Aegis is designed for developers who work with Java and Spring Boot applications.

The primary users include:

- Backend Developers
- Java Developers
- Spring Boot Developers
- Software Engineers
- Students learning software architecture
- Developers contributing to large enterprise projects

---

# Learning Goals Behind This Project

The primary purpose of this project was not only to build a useful developer tool but also to understand how professional software engineering tools work internally.

While developing Aegis, I wanted to gain practical knowledge of:

- Static Code Analysis
- Abstract Syntax Trees (AST)
- Graph Data Structures
- Graph Traversal Algorithms
- JavaParser
- VS Code Extension Development
- Software Architecture
- Clean Code Principles
- Modular System Design

This project helped me move beyond traditional CRUD applications and explore how developer tools analyze and understand source code.

---

# Key Takeaways

- Aegis is a VS Code extension for Spring Boot projects.
- It predicts the impact of code changes before refactoring.
- It performs static code analysis instead of executing the application.
- It uses JavaParser to convert Java source code into an Abstract Syntax Tree (AST).
- It builds a dependency graph to understand relationships between project components.
- Graph traversal algorithms are used to predict which components may be affected by a code change.
- The goal is to improve developer productivity and reduce the risk of introducing bugs during refactoring.

---

> 💡 **Interview Tip**

If an interviewer asks, "Tell me about your project," this entire section is enough to answer confidently in about 1–2 minutes. You don't need to memorize every sentence. Focus on understanding the flow:
>
> **Problem → Solution → Technologies → Algorithms → Outcome**


---

# Problem Statement

## Introduction

Modern software applications are much larger and more complex than they were a few years ago. A typical enterprise application may contain thousands of Java files, hundreds of APIs, multiple services, repositories, scheduled jobs, database interactions, and external integrations.

As a project grows, understanding how different parts of the application are connected becomes increasingly difficult.

A developer often spends more time understanding the existing code than writing new code.

One of the biggest challenges during software development is making changes to an existing codebase without unintentionally affecting other parts of the application.

This problem becomes even more significant during refactoring.

---

# Understanding the Problem

Imagine you have recently joined a software company.

On your first day, your team lead assigns you a task:

> "We need to modify the `PaymentService` class to support a new payment gateway."

At first, the task sounds simple.

However, before making any changes, several important questions immediately come to mind.

- Where is `PaymentService` used?
- Which controllers call this service?
- Which repositories are connected to it?
- Are there any scheduled jobs depending on it?
- Which APIs will be affected if I change this class?
- Which integration tests should I run after making changes?
- Is this class tightly connected with other modules?

Finding answers to these questions usually requires manually exploring dozens or even hundreds of files.

The larger the project becomes, the more time this process takes.

---

# Why Is This a Problem?

Making changes without understanding the complete impact can lead to serious issues.

For example,

A developer modifies a service class to fix one bug.

The application compiles successfully.

However, after deployment, another feature suddenly stops working because another module was indirectly depending on that service.

This happens because software components are interconnected.

A small change in one place can have unexpected consequences somewhere else.

Understanding these relationships before making changes is one of the biggest challenges in software maintenance.

---

# Existing Approach

Today, developers use several techniques to understand a project.

Some common approaches include:

- Reading source code manually
- Using "Find References"
- Using "Go to Definition"
- Using "Call Hierarchy"
- Reading project documentation
- Asking experienced team members

These approaches are helpful and are commonly used in software development.

However, they still require developers to manually combine information from different places to understand the complete picture.

For large projects, this process can become slow and mentally exhausting.

---

# The Core Problem

The actual problem is not finding where a class is used.

The real challenge is understanding **the overall impact of changing that class.**

Developers need answers such as:

- Which modules are affected?
- Which APIs depend on this class?
- How many components will be impacted?
- Is this change low risk or high risk?
- Which parts of the application should be tested?

Current IDE features provide pieces of this information, but developers still need to manually analyze the project to estimate the overall impact.

---

# Proposed Solution

Aegis was developed to make this process easier.

Instead of manually exploring the project, Aegis performs static code analysis on the source code.

It automatically identifies relationships between different components and builds a dependency graph representing the application's structure.

When a developer selects a class for analysis, Aegis traverses this dependency graph and generates an impact report.

Rather than simply listing references, the extension provides a higher-level understanding of how different parts of the application are connected.

This allows developers to estimate the possible impact of a change before performing a refactoring operation.

It is important to note that Aegis does **not guarantee** that a change will break the application.

Instead, it provides an estimate of the potential impact based on the static relationships found in the source code.

---

# Why Did I Choose This Problem?

While learning Spring Boot and exploring large Java projects, I noticed that understanding an unfamiliar codebase often takes more time than implementing new features.

I wanted to build something different from a traditional web application.

Instead of creating another CRUD project, I wanted to understand how professional developer tools analyze source code internally.

This project gave me the opportunity to learn concepts such as:

- Static Code Analysis
- Abstract Syntax Trees (AST)
- Graph Data Structures
- Graph Traversal Algorithms
- Software Architecture
- VS Code Extension Development

At the same time, it also solves a practical problem that developers commonly face when working on large projects.

---

# Scope of the Solution

The current version of Aegis focuses on Java Spring Boot applications.

It performs analysis without running the application.

The extension currently aims to:

- Analyze Java source code.
- Build a dependency graph.
- Estimate the impact of code changes.
- Calculate a risk score.
- Help developers understand project dependencies.

Future versions may support additional programming languages, frameworks, and more advanced analysis techniques.

---

# Expected Benefits

Using Aegis can help developers:

- Understand unfamiliar projects more quickly.
- Reduce the time spent manually exploring code.
- Refactor code with greater confidence.
- Better understand project architecture.
- Identify highly connected components.
- Improve developer productivity.

Although Aegis is not intended to replace existing IDE features, it complements them by providing a broader project-level understanding.

---

# Summary

The motivation behind Aegis is simple.

Developers should spend less time trying to understand the impact of code changes and more time solving actual business problems.

By automatically analyzing project dependencies and presenting meaningful insights, Aegis helps developers make more informed refactoring decisions while reducing the effort required to understand large codebases.

---

> 💡 Interview Tip

If an interviewer asks,

**"Why did you build this project?"**

A good answer is:

> "I wanted to move beyond traditional web applications and build a developer tool. While exploring large Spring Boot projects, I realized that understanding the impact of a code change is often time-consuming. Existing IDE features provide useful information like references and call hierarchy, but I wanted to learn how static code analysis and graph algorithms can be used to estimate the overall impact of a change. Building Aegis allowed me to explore these concepts while solving a practical software engineering problem."


---

# Project Objectives

## Introduction

Before starting the development of Aegis, I defined a set of objectives to clearly identify what I wanted the project to achieve.

These objectives helped me decide which features were essential for the first version of the extension and which features could be added in future releases.

The objectives of Aegis are divided into four categories:

- Business Objectives
- Technical Objectives
- Learning Objectives
- Future Objectives

This approach helped me keep the project focused while also leaving room for future improvements.

---

# Business Objectives

The primary purpose of Aegis is to help developers understand the impact of code changes before they modify or refactor a Spring Boot application.

The business objectives are:

### 1. Improve Code Understanding

Large software projects often contain hundreds or even thousands of source files.

Aegis should help developers understand how different parts of the application are connected without manually exploring the entire project.

---

### 2. Support Safer Refactoring

Before changing a class or method, developers should have a better understanding of what other components may be affected.

Aegis should provide enough information to help developers make more informed refactoring decisions.

---

### 3. Reduce Manual Exploration

Developers should spend less time navigating through files using search tools and more time solving actual development problems.

Aegis aims to reduce the effort required to understand project dependencies.

---

### 4. Improve Developer Productivity

By providing dependency information in one place, Aegis should help developers understand unfamiliar projects more quickly and complete development tasks more efficiently.

---

# Technical Objectives

From a technical perspective, Aegis was designed to achieve the following goals.

---

### 1. Perform Static Code Analysis

The extension should analyze Java source code without executing the application.

Static analysis makes the tool fast, safe, and independent of runtime environments.

---

### 2. Parse Java Source Code

The analyzer should read Java source files and convert them into an Abstract Syntax Tree (AST).

The AST should be used to extract useful information such as:

- Classes
- Interfaces
- Methods
- Fields
- Packages
- Annotations
- Imports

---

### 3. Build a Dependency Graph

The extracted information should be converted into a dependency graph.

The graph should represent relationships between different components of the application.

Examples include:

- Controller → Service
- Service → Repository
- Service → Utility
- Class → Interface

This graph becomes the foundation of the entire project.

---

### 4. Perform Impact Analysis

When a developer selects a class, Aegis should analyze the dependency graph and estimate which components may be affected if that class is modified.

The analysis should consider both direct and indirect dependencies.

---

### 5. Generate a Risk Score

Aegis should calculate a simple risk score based on project relationships.

The score is not intended to guarantee failures.

Instead, it should provide an estimate of how connected or influential a component is within the application.

---

### 6. Display Results Inside VS Code

The extension should present analysis results directly inside Visual Studio Code.

Developers should not need to switch to another application to view the analysis.

---

# Learning Objectives

One of the main reasons I chose this project was to learn concepts that are commonly used in professional software engineering but are rarely covered through traditional CRUD applications.

Through Aegis, I wanted to gain practical experience in the following areas.

---

### Static Code Analysis

Understand how developer tools inspect source code without executing applications.

---

### Abstract Syntax Trees (AST)

Learn how programming languages are represented internally after parsing.

Understand how ASTs are used by compilers, IDEs, and developer tools.

---

### Graph Data Structures

Represent software components as nodes and their relationships as edges.

Use graph structures to model real-world software architecture.

---

### Graph Algorithms

Learn how algorithms such as Depth First Search (DFS) and Breadth First Search (BFS) can be used to analyze project dependencies.

---

### VS Code Extension Development

Understand how Visual Studio Code extensions work and how they interact with external applications.

---

### Software Architecture

Design a modular system that separates parsing, graph generation, analysis, visualization, and communication into independent components.

---

### Clean Code and SOLID Principles

Apply software engineering best practices while developing a real-world developer tool.

---

# Success Criteria

I considered Aegis successful if it could achieve the following goals.

✅ Parse a Spring Boot project successfully.

✅ Extract classes and project dependencies.

✅ Build a dependency graph.

✅ Analyze selected classes.

✅ Estimate impacted components.

✅ Display the results inside VS Code.

If these objectives are achieved, the first version of Aegis fulfills its primary purpose.

---

# Current Project Scope

The current version focuses on:

- Java
- Spring Boot
- Static Code Analysis
- Dependency Analysis
- Impact Prediction
- Risk Estimation

The current version does not include:

- Runtime Analysis
- Multi-language Support
- AI-based Prediction
- Cloud Synchronization
- Team Collaboration

These features are planned for future releases.

---

# Long-Term Vision

Although the first version focuses on Spring Boot applications, the long-term vision of Aegis is much broader.

Future versions may support:

- Kotlin
- Python
- C#
- Node.js
- Microservice Architecture
- Git Integration
- Architecture Validation
- Security Analysis
- Technical Debt Analysis
- AI-powered Code Explanation

The long-term goal is to transform Aegis from a simple impact analysis tool into a complete developer intelligence platform.

---

# Summary

The objectives of Aegis extend beyond solving a single programming problem.

The project was designed to help developers better understand large software systems while also giving me practical experience with static code analysis, software architecture, graph algorithms, and VS Code extension development.

Each objective contributes toward building a developer tool that is useful, technically challenging, and educational.

---

> 💡 Interview Tip

If an interviewer asks,

**"What was your goal while building Aegis?"**

A good answer is:

> "My main objective was to understand how professional developer tools analyze source code internally. Instead of building another CRUD application, I wanted to explore static code analysis, AST parsing, graph algorithms, and VS Code extension development while solving the practical problem of understanding the impact of code changes in large Spring Boot projects."


---

# System Architecture

## Introduction

Aegis is designed using a modular architecture.

Instead of putting all the logic inside the VS Code extension, the project is divided into independent components, where each component has a specific responsibility.

This makes the project easier to maintain, easier to test, and easier to extend in the future.

One of the main goals while designing Aegis was to follow the **Single Responsibility Principle (SRP)** from the SOLID principles.

Each module performs only one task and communicates with other modules through well-defined interfaces.

---

# High-Level Architecture

```text
                +---------------------------+
                |      VS Code Editor       |
                +------------+--------------+
                             |
                             |
                             ▼
                +---------------------------+
                |     Aegis Extension        |
                | (TypeScript + VS Code API) |
                +------------+--------------+
                             |
                     JSON Communication
                             |
                             ▼
                +---------------------------+
                |    Analyzer Engine        |
                |        (Java 21)          |
                +------------+--------------+
                             |
       +----------+----------+----------+----------+
       |          |          |          |          |
       ▼          ▼          ▼          ▼          ▼
   Parser     Graph     Analysis     Risk     Export
   Module     Module     Module     Module    Module
```

---

# Why Did I Choose This Architecture?

Initially, I thought about writing the entire project using only TypeScript inside the VS Code extension.

However, I decided to separate the extension from the analysis engine for several reasons.

### Separation of Responsibilities

The VS Code extension is responsible for:

- User interaction
- Commands
- Menus
- Displaying results
- Communication with the analyzer

The Analyzer Engine is responsible for:

- Parsing Java source code
- Building the dependency graph
- Running algorithms
- Performing impact analysis
- Calculating the risk score

Keeping these responsibilities separate makes the project much cleaner.

---

### Better Maintainability

Suppose I later decide to create an IntelliJ plugin.

I won't need to rewrite the analyzer.

Only the IDE integration changes.

The analyzer engine remains exactly the same.

This separation reduces code duplication.

---

### Better Scalability

The analyzer can later be converted into:

- REST API
- CLI Application
- IntelliJ Plugin
- Eclipse Plugin
- Cloud Service

without changing its internal logic.

---

# System Components

The architecture consists of two main modules.

## 1. VS Code Extension

Technology:
- TypeScript
- VS Code Extension API

Responsibilities:

- Detect when a Java project is opened.
- Register extension commands.
- Start the analyzer process.
- Send project information.
- Receive analysis results.
- Display reports.
- Show dependency graphs.

The extension acts as the user interface of the project.

It does not perform any code analysis.

---

## 2. Analyzer Engine

Technology:
- Java 21
- Maven

Responsibilities:

- Read Java source files.
- Parse source code.
- Build project model.
- Generate dependency graph.
- Perform graph analysis.
- Calculate risk score.
- Return analysis results.

This is the core of Aegis.

Most of the project's business logic is implemented here.

---

# Internal Modules

The analyzer is divided into multiple modules.

This makes the code easier to understand and maintain.

---

## Parser Module

Responsibilities:

- Read Java files.
- Parse source code.
- Generate Abstract Syntax Tree (AST).
- Extract project information.

Input:

Java source code

Output:

Project Model

---

## Graph Module

Responsibilities:

- Create nodes.
- Create relationships.
- Build dependency graph.

Input:

Project Model

Output:

Dependency Graph

---

## Analysis Module

Responsibilities:

- Traverse dependency graph.
- Find affected components.
- Perform impact analysis.

Input:

Dependency Graph

Output:

Impact Report

---

## Risk Module

Responsibilities:

- Analyze dependency strength.
- Calculate project risk score.

Input:

Impact Report

Output:

Risk Score

---

## Export Module

Responsibilities:

- Convert analysis results into JSON.
- Send results back to VS Code.

---

# Data Flow

The following diagram shows how information moves through the system.

```text
Java Project

↓

Read Java Files

↓

JavaParser

↓

AST Generation

↓

Project Model

↓

Dependency Graph

↓

Impact Analysis

↓

Risk Calculation

↓

JSON Report

↓

VS Code Extension

↓

Developer
```

---

# Why Use JSON?

The VS Code extension is written in TypeScript.

The analyzer is written in Java.

Both applications need a common communication format.

JSON is:

- Lightweight
- Easy to read
- Language independent
- Fast to serialize
- Widely supported

For these reasons, JSON was chosen for communication.

---

# Advantages of This Architecture

The chosen architecture provides several benefits.

### Modular

Each component has a single responsibility.

---

### Easy to Maintain

Changes in one module have minimal impact on other modules.

---

### Reusable

The analyzer engine can be reused in other IDEs or applications.

---

### Extensible

New analyzers can be added later without redesigning the project.

Examples:

- Security Analyzer
- Dead Code Analyzer
- Complexity Analyzer
- Architecture Analyzer

---

### Testable

Each module can be tested independently.

This improves code quality.

---

# Architecture Limitations

No architecture is perfect.

The current architecture also has limitations.

### Java Only

Currently, only Java projects are supported.

---

### Static Analysis

The analyzer cannot detect runtime dependencies created through:

- Reflection
- Dynamic proxies
- Runtime-generated code

---

### Large Projects

Very large enterprise applications may require optimization to reduce analysis time.

---

# Future Improvements

The architecture was intentionally designed to support future expansion.

Possible improvements include:

- Plugin-based analyzer system.
- Incremental analysis.
- Background analysis.
- Multi-language support.
- Cloud synchronization.
- Team collaboration.

The current modular design makes these improvements easier to implement.

---

# Summary

Aegis follows a modular architecture that separates the user interface from the analysis engine.

This separation improves maintainability, scalability, and code organization.

Each module has a clearly defined responsibility, making the system easier to understand and extend.

Although the current version focuses on Spring Boot projects, the architecture allows future support for additional languages, IDEs, and analysis modules without requiring major redesign.

---

> 💡 Interview Tip

If an interviewer asks:

**"Why didn't you implement everything inside the VS Code extension?"**

A good answer is:

> "I wanted to separate the presentation layer from the analysis layer. The VS Code extension only handles user interaction, while the analyzer engine performs all code analysis. This makes the system more modular, reusable, and easier to extend. For example, in the future I can reuse the same analyzer in an IntelliJ plugin or expose it as a REST API without changing the core logic."



---

# Project Structure

## Introduction

Aegis is organized as a multi-module project.

Instead of keeping all the source code in one application, the project is divided into separate modules based on their responsibilities.

This makes the project easier to understand, maintain, test, and extend.

The current project structure is shown below.

```text
aegis/

├── analyzer-engine/
├── vscode-extension/
├── sample-project/
├── README.md
└── .gitignore
```

Each module has a specific purpose.

---

# Project Overview

The project currently consists of three main modules.

| Module | Purpose |
|---------|---------|
| analyzer-engine | Performs all code analysis and generates impact reports |
| vscode-extension | Provides the user interface inside Visual Studio Code |
| sample-project | Sample Spring Boot application used for testing and development |

---

# 1. Analyzer Engine

The Analyzer Engine is the core of Aegis.

Almost all of the business logic is implemented here.

Its responsibilities include:

- Reading Java source files.
- Parsing Java code.
- Building the project model.
- Creating the dependency graph.
- Running impact analysis.
- Calculating the risk score.
- Returning results as JSON.

The analyzer is completely independent of VS Code.

This means it can later be reused in:

- IntelliJ IDEA plugins
- Command Line (CLI) tools
- REST APIs
- Cloud-based analysis services

---

## Current Structure

```text
analyzer-engine/

src/

main/

java/

com/

aegis/

analyzer/

ast/

graph/

analysis/
```

---

# AST Package

```text
ast/

JavaParserClient.java
```

### Responsibility

This package is responsible for parsing Java source files.

It converts Java source code into an Abstract Syntax Tree (AST).

The AST is later used to extract project information such as:

- Classes
- Methods
- Interfaces
- Imports
- Annotations

Think of this package as the "reader" of the source code.

---

# Graph Package

```text
graph/

DependencyGraphGenerator.java

models/

DependencyNode.java

DependencyEdge.java
```

### Responsibility

After parsing the project, Aegis needs to understand how different components are connected.

The Graph package creates this relationship model.

It represents:

- Classes as nodes
- Dependencies as edges

This graph becomes the foundation for all future analysis.

---

# Analysis Package

```text
analysis/

ImpactAnalyzer.java

RiskScorer.java
```

### Responsibility

This package performs the actual analysis.

It uses the dependency graph to answer questions such as:

- Which components may be affected?
- How many dependencies exist?
- What is the estimated risk of modifying a class?

This package contains the main algorithms of Aegis.

---

# 2. VS Code Extension

The VS Code extension is responsible for interacting with the developer.

Unlike the analyzer engine, it does not analyze Java code.

Its responsibilities include:

- Registering commands.
- Starting the analyzer.
- Sending project information.
- Receiving analysis results.
- Displaying reports.
- Rendering graphs.

Think of it as the presentation layer of Aegis.

---

## Current Structure

```text
vscode-extension/

src/

extension.ts

webview/

index.html

graph-visualizer.js
```

---

# extension.ts

This is the entry point of the extension.

Responsibilities:

- Activate the extension.
- Register commands.
- Communicate with the analyzer.
- Open the webview.

Every VS Code extension starts from this file.

---

# WebView

The WebView provides a custom user interface inside VS Code.

Instead of using simple notification messages, Aegis displays rich visual information using a WebView.

Examples include:

- Dependency graph
- Risk report
- Impact summary

---

# 3. Sample Project

```text
sample-project/
```

This module is a small Spring Boot application used during development.

Its purpose is to:

- Test the parser.
- Verify dependency extraction.
- Test graph generation.
- Validate impact analysis.

Using a dedicated sample project allows development without relying on external repositories.

---

# Why Did I Choose This Structure?

I chose this structure because it separates different responsibilities.

Instead of one large application doing everything, each module focuses on one specific task.

This provides several advantages.

---

## Better Maintainability

Each module can be developed independently.

Changes inside the VS Code extension do not affect the analyzer.

Similarly, improvements to the analyzer do not require changes to the UI.

---

## Better Reusability

The analyzer can later be reused in other applications without modification.

For example:

- IntelliJ Plugin
- Eclipse Plugin
- REST API
- CLI Tool

---

## Easier Testing

Each module can be tested separately.

For example:

- Parser tests
- Graph tests
- Impact analysis tests
- VS Code extension tests

This improves reliability.

---

## Easier Future Expansion

Suppose I later want to add:

- Security Analyzer
- Complexity Analyzer
- Dead Code Analyzer

I can simply add new modules to the analyzer without redesigning the project.

---

# Planned Future Structure

As Aegis grows, I plan to organize the analyzer into more specialized modules.

```text
analyzer-engine/

parser/

model/

graph/

analysis/

risk/

export/

utils/

api/
```

This will improve code organization and make future maintenance easier.

---

# Summary

The project structure of Aegis reflects the principle of separation of concerns.

The VS Code extension handles user interaction, while the analyzer engine performs all code analysis.

Within the analyzer, different packages are responsible for parsing, graph generation, and impact analysis.

This modular structure makes the project scalable, reusable, and easier to maintain as new features are added.

---

> 💡 Interview Tip

If an interviewer asks:

**"Why did you separate the analyzer from the VS Code extension?"**

A good answer is:

> "I wanted to separate the user interface from the business logic. The extension is responsible only for interacting with the user, while the analyzer focuses entirely on code analysis. This design makes the analyzer reusable in other tools like IntelliJ plugins or CLI applications without changing its core logic."



---

# Technology Stack

## Introduction

Choosing the right technology is an important part of software engineering.

Every technology used in Aegis was selected for a specific reason. Instead of choosing tools based on popularity, I selected technologies that best fit the requirements of the project.

Since Aegis analyzes Java Spring Boot applications, the technology stack needed to support Java parsing, graph analysis, VS Code integration, and interactive visualization.

The following sections explain each technology, why I selected it, and how it contributes to the project.

---

# Technology Overview

| Technology | Purpose |
|------------|---------|
| Java 21 | Analyzer Engine |
| TypeScript | VS Code Extension |
| VS Code Extension API | Extension Development |
| JavaParser | Java Source Code Parsing |
| React | User Interface |
| React Flow | Graph Visualization |
| Maven | Build & Dependency Management |
| JSON | Communication between Extension and Analyzer |

---

# Java 21

## What is Java?

Java is a high-level, object-oriented programming language widely used for enterprise software development.

Many large backend applications, especially Spring Boot applications, are built using Java.

Since Aegis is designed specifically for Spring Boot projects, Java is the most suitable language for building the analyzer engine.

---

## Why Did I Choose Java?

I selected Java because:

- The source code being analyzed is written in Java.
- JavaParser is built specifically for Java.
- Java provides strong object-oriented programming features.
- It is widely used in enterprise software development.
- It has excellent support for static code analysis tools.

Using Java also makes it easier to understand Java language features such as annotations, inheritance, interfaces, and packages.

---

## Why Java 21?

I chose Java 21 because it is the latest Long-Term Support (LTS) version.

Benefits include:

- Improved performance
- Modern language features
- Long-term support
- Better developer experience

---

## How Does Java Help Aegis?

Java is responsible for:

- Reading source files
- Parsing Java code
- Building dependency graphs
- Running graph algorithms
- Generating impact reports

It forms the core processing engine of Aegis.

---

# TypeScript

## What is TypeScript?

TypeScript is a strongly typed programming language built on top of JavaScript.

It adds static typing, better tooling, and improved code maintainability.

---

## Why Did I Choose TypeScript?

VS Code extensions are officially developed using TypeScript.

TypeScript provides:

- Better IntelliSense
- Type safety
- Easier debugging
- Better code organization
- Improved maintainability

As the extension grows, static typing helps reduce development errors.

---

## How Does TypeScript Help Aegis?

TypeScript is responsible for:

- Extension activation
- Command registration
- Communication with the analyzer
- User interface logic
- Webview integration

It acts as the bridge between the developer and the analyzer engine.

---

# VS Code Extension API

## What is the VS Code Extension API?

The VS Code Extension API allows developers to extend the functionality of Visual Studio Code.

Using this API, developers can create:

- Commands
- Sidebars
- Custom views
- Context menus
- Webviews
- Language support

---

## Why Did I Choose VS Code?

Visual Studio Code is one of the most popular code editors among developers.

Building Aegis as a VS Code extension allows developers to use it without leaving their development environment.

The analysis results appear directly inside the IDE, making the workflow more convenient.

---

## How Does the Extension API Help Aegis?

It allows Aegis to:

- Detect project folders
- Register commands
- Display custom UI
- Open Webviews
- Communicate with external processes

---

# JavaParser

## What is JavaParser?

JavaParser is an open-source Java library that reads Java source code and converts it into an Abstract Syntax Tree (AST).

Instead of treating source code as plain text, JavaParser understands the structure of Java programs.

This makes it possible to identify:

- Classes
- Interfaces
- Methods
- Fields
- Packages
- Imports
- Annotations

---

## Why Did I Choose JavaParser?

Before selecting JavaParser, I explored different options for parsing Java code.

I chose JavaParser because:

- It is lightweight.
- It has excellent documentation.
- It is easy to integrate into Java applications.
- It provides a clean API.
- It is widely used for static analysis and code generation.

For the goals of Aegis, JavaParser provided the right balance between simplicity and functionality.

---

## How Does JavaParser Help Aegis?

JavaParser is one of the most important technologies used in Aegis.

It performs the following tasks:

- Reads Java source files.
- Generates the Abstract Syntax Tree (AST).
- Extracts classes.
- Extracts methods.
- Identifies annotations.
- Finds imports.
- Detects inheritance relationships.
- Provides information required to build the dependency graph.

Without JavaParser, Aegis would not be able to understand the structure of Java source code.

---

# React

## What is React?

React is a JavaScript library for building modern user interfaces.

It allows applications to create dynamic and interactive components.

---

## Why Did I Choose React?

Aegis needs to display analysis reports and dependency graphs.

React makes it easier to build reusable UI components and manage application state.

It also integrates well with VS Code Webviews.

---

## How Does React Help Aegis?

React is responsible for:

- Dashboard
- Impact Report
- Risk Report
- Interactive Panels
- Future UI components

---

# React Flow

## What is React Flow?

React Flow is a library for creating interactive node-based diagrams.

It is commonly used for workflows, dependency graphs, and flowcharts.

---

## Why Did I Choose React Flow?

Aegis represents software dependencies as graphs.

Instead of building a graph visualization system from scratch, React Flow provides:

- Zoom
- Drag
- Interactive nodes
- Edge rendering
- Smooth navigation

This significantly reduces development effort.

---

## How Does React Flow Help Aegis?

React Flow visualizes:

- Dependency Graph
- Class Relationships
- Service Connections
- Future Architecture Maps

---

# Maven

## What is Maven?

Maven is a build automation and dependency management tool for Java.

---

## Why Did I Choose Maven?

Maven is the standard build tool for most Spring Boot projects.

It simplifies:

- Dependency management
- Project builds
- Plugin integration
- Testing

Using Maven also makes it easy for other developers to build Aegis.

---

# JSON

## Why JSON?

The VS Code extension is written in TypeScript.

The analyzer engine is written in Java.

Both applications need a common format for exchanging information.

JSON was chosen because it is:

- Lightweight
- Human-readable
- Language-independent
- Easy to serialize and deserialize

It provides a simple way for the extension and analyzer to communicate.

---

# Why Didn't I Use Other Technologies?

## Python

Python is excellent for scripting and data analysis.

However, since Aegis analyzes Java source code and uses JavaParser, building the analyzer in Java provides better compatibility and easier integration.

---

## JavaScript

JavaScript could have been used for the extension.

However, TypeScript provides type safety, which becomes increasingly important as the project grows.

---

## IntelliJ Plugin

I considered building an IntelliJ plugin.

However, VS Code has a larger developer community and a lower learning curve for extension development.

Building the first version for VS Code also allows faster iteration.

---

# Summary

The technology stack of Aegis was selected based on the requirements of the project rather than popularity.

Each technology has a clearly defined role:

- Java performs the analysis.
- JavaParser understands the source code.
- TypeScript powers the extension.
- React builds the user interface.
- React Flow visualizes project relationships.
- Maven manages the Java project.
- JSON connects the different components.

Together, these technologies form a modular, maintainable, and scalable developer tool.

---

> 💡 Interview Tip

If an interviewer asks:

**"Why did you choose JavaParser instead of writing your own parser?"**

A good answer is:

> "Writing a complete Java parser is a very large project and not the main goal of Aegis. My goal was to build an impact analysis engine, not a Java compiler. JavaParser already provides a reliable Abstract Syntax Tree, allowing me to focus on dependency analysis, graph algorithms, and software architecture."



---

# Static Code Analysis

## Introduction

Static Code Analysis is one of the core technologies behind Aegis.

Everything that Aegis does—understanding source code, finding dependencies, building the dependency graph, and estimating the impact of a code change—starts with static code analysis.

Without static code analysis, Aegis would not be able to understand the structure of a Java project.

Before understanding how Aegis works, it is important to understand what static code analysis actually is.

---

# What is Static Code Analysis?

Static Code Analysis is the process of analyzing source code **without executing the program**.

Instead of running the application, a static analysis tool reads the source code, understands its structure, and extracts useful information.

Think of it as reading a book.

You don't have to act out every scene to understand the story.

You simply read the pages and understand how everything is connected.

Static code analysis works in a similar way.

It reads the source code instead of executing it.

---

# Simple Example

Suppose we have the following Java class.

```java
public class UserService {

    public void login() {
        System.out.println("User Logged In");
    }

}
```

A human can immediately understand that:

- There is one class.
- The class name is `UserService`.
- It contains one method.
- The method name is `login()`.

A static analysis tool also understands these details.

The difference is that it does not execute the code.

It simply analyzes the source code.

---

# Why Do We Need Static Code Analysis?

Modern software projects can contain:

- Thousands of Java files
- Hundreds of APIs
- Multiple modules
- Services
- Repositories
- Utility classes
- Configuration files

Understanding these relationships manually becomes difficult.

Static code analysis helps automate this process.

Instead of manually reading every file, a tool can automatically discover:

- Classes
- Methods
- Interfaces
- Packages
- Annotations
- Imports
- Dependencies

This information becomes the foundation for higher-level analysis.

---

# How Aegis Uses Static Code Analysis

Static code analysis is the first step performed by Aegis.

The overall workflow looks like this:

```text
Java Source Code

↓

Static Code Analysis

↓

AST Generation

↓

Dependency Extraction

↓

Dependency Graph

↓

Impact Analysis

↓

Risk Score

↓

Developer Report
```

Notice that the application is **never executed** during this process.

Everything is determined by analyzing the source code.

---

# Real-Life Example

Imagine you join a company and receive a task.

Your manager says:

> "Modify the PaymentService."

Before changing anything, you want to know:

- Which controllers use this service?
- Which repositories are connected?
- Which APIs depend on it?
- Which other services call it?

You could manually search hundreds of files.

Or a static analysis tool can automatically answer these questions in a few seconds.

That is exactly what Aegis is designed to do.

---

# What Information Can Static Analysis Extract?

Static analysis can identify many important elements from source code.

For example:

### Classes

```java
public class PaymentService
```

---

### Interfaces

```java
public interface PaymentGateway
```

---

### Methods

```java
public void processPayment()
```

---

### Fields

```java
private UserRepository repository;
```

---

### Packages

```java
package com.example.payment;
```

---

### Imports

```java
import org.springframework.stereotype.Service;
```

---

### Annotations

```java
@Service
```

---

### Inheritance

```java
class AdminService extends UserService
```

---

### Interface Implementation

```java
class PaymentService implements PaymentGateway
```

---

### Dependencies

```java
private PaymentRepository repository;
```

This tells Aegis that:

PaymentService

↓

depends on

↓

PaymentRepository

---

# What Static Analysis Cannot Do

Static analysis is powerful, but it also has limitations.

Since the application is not executed, it cannot determine everything.

For example, it cannot reliably detect:

- Runtime-generated objects
- Reflection-based dependencies
- Dynamic proxies
- Runtime configuration changes
- User input
- Actual runtime values

This is why Aegis provides an **estimate** of impact rather than a guarantee.

---

# Static Analysis vs Dynamic Analysis

| Static Analysis | Dynamic Analysis |
|----------------|------------------|
| Does not execute the application | Executes the application |
| Reads source code | Observes runtime behavior |
| Faster | Usually slower |
| Can analyze incomplete projects | Requires the application to run |
| Finds structural relationships | Finds runtime behavior |

Both approaches are valuable.

Aegis focuses on static analysis because its goal is to understand project structure before code is executed.

---

# Advantages of Static Code Analysis

Using static analysis provides several benefits.

### Fast

The application does not need to be compiled or executed.

---

### Safe

No risk of changing databases or external systems.

---

### Early Feedback

Developers receive useful information before running the application.

---

### Better Code Understanding

Relationships between classes become easier to understand.

---

### Foundation for Developer Tools

Many professional developer tools are built on static analysis.

Examples include:

- SonarQube
- SonarLint
- PMD
- Checkstyle
- SpotBugs

---

# Why Did I Choose Static Analysis for Aegis?

The main purpose of Aegis is to help developers understand code before making changes.

Running the application is not necessary for this purpose.

Static analysis allows Aegis to:

- Analyze projects quickly.
- Work without a running server.
- Understand project structure.
- Build dependency graphs.
- Estimate the impact of code changes.

For these reasons, static analysis is the best approach for the first version of Aegis.

---

# Limitations

Although static analysis is very useful, it is not perfect.

Some limitations include:

- Cannot predict runtime behavior.
- Cannot understand reflection completely.
- Cannot detect dependencies created dynamically.
- May produce false positives in complex projects.

Because of these limitations, Aegis should be considered a decision-support tool rather than a tool that guarantees whether code changes are safe.

---

# Summary

Static Code Analysis is the foundation of Aegis.

Instead of executing the application, Aegis reads and understands the source code.

This allows it to identify classes, methods, dependencies, and project structure.

The extracted information is then used to build a dependency graph, which becomes the basis for impact prediction and risk estimation.

Without static analysis, Aegis would not be able to understand how different parts of a software project are connected.

---

# Frequently Asked Interview Questions

## 1. What is Static Code Analysis?

Static Code Analysis is the process of analyzing source code without executing the application. It helps understand the structure of the program, identify relationships, and detect potential issues early in development.

---

## 2. Why did you use Static Code Analysis in Aegis?

Because Aegis needs to understand the structure of a Spring Boot project before developers make changes. Static analysis provides this information without requiring the application to run.

---

## 3. What is the difference between Static and Dynamic Analysis?

Static analysis examines the source code without execution, while dynamic analysis studies the application's behavior while it is running.

---

## 4. Can Static Code Analysis detect everything?

No. It cannot accurately detect runtime behavior, reflection-based dependencies, dynamically generated code, or runtime configuration changes.

---

## 5. Is Static Code Analysis enough for production systems?

Not always.

Static analysis provides valuable insights, but it is usually combined with testing, runtime monitoring, and code reviews to ensure software quality.

---

# Quick Revision Notes

✅ Static Code Analysis reads source code without running it.

✅ It helps understand project structure.

✅ It identifies classes, methods, annotations, and dependencies.

✅ Aegis uses Static Code Analysis as the first step in its analysis pipeline.

✅ The output of Static Code Analysis is later converted into an AST and then into a dependency graph.

✅ Static analysis estimates potential impact but cannot guarantee runtime behavior.

---

> 💡 Interview Tip

If an interviewer asks:

**"Why does Aegis use Static Code Analysis instead of running the application?"**

A good answer is:

> "The goal of Aegis is to understand the structure of the codebase before developers make changes. Static analysis is ideal for this because it works directly on the source code, doesn't require the application to run, and provides the information needed to build dependency graphs and estimate the impact of code changes."



---

# How Aegis Understands Java Code

## Introduction

Before Aegis can predict the impact of a code change, it first needs to understand the source code.

However, computers cannot understand Java code the way humans do.

When a developer looks at the following code,

```java
@Service
public class UserService {

    public void login() {
        System.out.println("User Logged In");
    }

}
```

the developer immediately understands:

- There is a class called `UserService`.
- It is a Spring Service.
- It contains one method called `login()`.

A computer cannot understand this by simply reading the text.

It first needs to convert the source code into a structured representation.

This conversion happens in several stages.

Understanding these stages is important because Aegis relies on them to analyze Java projects.

---

# Step 1 — Source Code

Everything starts with the Java source code.

Example:

```java
@Service
public class UserService {

    public void login() {
        System.out.println("User Logged In");
    }

}
```

At this stage, this is just plain text stored inside a `.java` file.

The computer has not yet understood anything.

---

# Step 2 — Lexical Analysis

The first step is called **Lexical Analysis**.

A program called a **Lexer** (or Tokenizer) reads the source code character by character.

Its job is to break the code into small meaningful pieces called **tokens**.

Think of it like reading an English sentence.

Sentence:

```
I love programming.
```

Words:

- I
- love
- programming

Similarly, Java code is divided into tokens.

Example:

```java
public class UserService
```

becomes

```
public

class

UserService
```

Each token has a meaning.

Some tokens represent:

- Keywords
- Identifiers
- Operators
- Literals
- Symbols

The lexer does not understand relationships.

It only separates the code into tokens.

---

# Step 3 — Parsing

Now the parser receives these tokens.

The parser's job is to understand the grammar of the programming language.

Instead of seeing individual words,

it understands complete statements.

For example,

```
public class UserService
```

is recognized as

"A Java class declaration."

Similarly,

```
public void login()
```

is recognized as

"A method declaration."

The parser checks whether the source code follows Java syntax rules.

If the syntax is invalid,

the parser reports an error.

---

# Step 4 — Abstract Syntax Tree (AST)

After successful parsing,

the parser creates an **Abstract Syntax Tree**, commonly called an AST.

An AST is a tree-like representation of the structure of the source code.

Instead of storing the exact formatting of the program,

it stores only the important programming constructs.

For example,

```java
public class UserService {

    public void login() {

    }

}
```

can be represented as

```
Compilation Unit

│

└── Class

      UserService

      │

      └── Method

            login()
```

Notice something important.

The AST does **not** care about:

- Spaces
- Tabs
- Blank lines
- Indentation

It only represents the structure of the program.

This makes it much easier for software tools to analyze code.

---

# Why Is It Called "Abstract"?

The word **Abstract** means

"Only the important information is kept."

For example,

these two programs produce exactly the same AST.

```java
public class UserService{

public void login(){

}

}
```

and

```java
public class UserService {

    public void login() {

    }

}
```

Although the formatting is different,

their structure is identical.

The AST ignores formatting because formatting does not affect program behavior.

---

# How Does Aegis Use the AST?

This is one of the most important parts of the project.

Aegis does **not** analyze raw Java code.

Instead,

it analyzes the AST generated by JavaParser.

From the AST,

Aegis extracts information such as:

- Classes
- Interfaces
- Methods
- Fields
- Packages
- Imports
- Annotations
- Inheritance
- Interface implementations

For example,

suppose the AST contains

```
Class

↓

PaymentService

↓

Field

↓

PaymentRepository repository
```

Aegis understands that

**PaymentService depends on PaymentRepository.**

This dependency later becomes an edge inside the dependency graph.

---

# Why Not Read the Source Code Directly?

A common question is,

"Why not simply search the source code using regular expressions?"

The answer is reliability.

Regular expressions only match text.

They do not understand Java syntax.

For example,

a regular expression cannot reliably distinguish between:

- A class
- A comment
- A string
- A method
- An annotation

The AST already understands the complete structure of the program.

This makes analysis much more accurate.

---

# Real-World Example

Suppose a project contains

```
OrderController

↓

OrderService

↓

PaymentService

↓

PaymentRepository
```

The AST allows Aegis to identify these relationships automatically.

Once these relationships are extracted,

they are converted into a dependency graph.

The graph is then used for impact analysis.

---

# Advantages of Using AST

Using an AST provides several benefits.

- Understands program structure.
- Ignores formatting differences.
- Easier to analyze.
- More reliable than text matching.
- Supports accurate dependency extraction.
- Forms the foundation of static analysis.

---

# Limitations

The AST only represents the source code.

It does not know:

- Runtime values
- Database contents
- Reflection-generated objects
- User input
- Runtime behavior

These require dynamic analysis.

---

# Summary

The AST is one of the most important concepts behind Aegis.

It acts as a bridge between raw Java source code and the dependency graph.

Instead of analyzing plain text,

Aegis analyzes the structured representation created by JavaParser.

This allows the project to accurately understand software components and their relationships before performing impact analysis.

---

# Frequently Asked Interview Questions

## What is an AST?

An Abstract Syntax Tree is a tree representation of the structure of source code. It contains only the important programming constructs and ignores formatting.

---

## Why is AST needed?

Computers cannot directly understand source code.

The AST provides a structured representation that makes code analysis much easier.

---

## Why is AST better than Regular Expressions?

Regular expressions only match text patterns.

An AST understands Java syntax and relationships, making analysis much more reliable.

---

## Does the AST execute the program?

No.

It only represents the structure of the source code.

---

## Does every programming language have an AST?

Yes.

Almost every modern compiler or parser generates some form of Abstract Syntax Tree.

---

# Quick Revision

✅ AST = Tree representation of source code.

✅ Parser creates the AST.

✅ JavaParser generates the AST for Aegis.

✅ Aegis analyzes the AST, not raw Java code.

✅ AST ignores formatting.

✅ AST is the foundation of dependency extraction.



---

# JavaParser

## Introduction

After understanding what an Abstract Syntax Tree (AST) is, the next question is:

> **How do we actually generate an AST from Java source code?**

This is where **JavaParser** comes into the picture.

JavaParser is one of the most important libraries used in Aegis.

It reads Java source files, understands their syntax, and converts them into an Abstract Syntax Tree (AST), which can then be analyzed programmatically.

Without JavaParser, Aegis would not be able to understand the structure of a Java project.

---

# What is JavaParser?

JavaParser is an open-source Java library used to parse Java source code.

Instead of treating a `.java` file as plain text, JavaParser understands Java syntax and converts the source code into an AST.

Think of JavaParser as a translator.

```
Java Source Code

↓

JavaParser

↓

Abstract Syntax Tree (AST)
```

Once the AST is generated, developers can easily inspect classes, methods, fields, annotations, imports, interfaces, inheritance, and many other language constructs.

---

# Why Did I Choose JavaParser?

Before selecting JavaParser, I looked at different options.

I wanted a parser that was:

- Easy to learn
- Well documented
- Open source
- Actively maintained
- Reliable
- Suitable for static analysis tools

JavaParser fulfilled all these requirements.

Another option was **Eclipse JDT**, which is also very powerful.

However, Eclipse JDT is more complex and closely integrated with the Eclipse ecosystem.

Since Aegis focuses on understanding Spring Boot projects rather than building a full Java compiler or IDE, JavaParser was the better choice.

---

# How JavaParser Works

The process is quite simple.

```
Java File

↓

Read Source Code

↓

JavaParser

↓

Generate AST

↓

Aegis Reads AST

↓

Dependency Extraction

↓

Dependency Graph
```

Notice that JavaParser does **not** perform dependency analysis.

It only generates the AST.

Everything after that is implemented inside Aegis.

---

# Example

Suppose we have the following Java class.

```java
package com.example.service;

@Service
public class UserService {

    private UserRepository repository;

    public void login() {

    }

}
```

JavaParser reads this file and creates an AST.

The AST contains nodes representing:

- Package Declaration
- Import Statements
- Class Declaration
- Annotation
- Field Declaration
- Method Declaration

Instead of reading plain text, Aegis can now work with these structured nodes.

---

# How Aegis Uses JavaParser

Aegis does not analyze the source code directly.

Instead, it asks JavaParser to generate an AST.

Once the AST is available, Aegis starts visiting each node.

For example:

```
Compilation Unit

│

├── Package

├── Imports

└── Class

     │

     ├── Annotation

     ├── Fields

     └── Methods
```

From these nodes, Aegis extracts useful information.

For example,

if the AST contains:

```java
private PaymentRepository repository;
```

Aegis records:

```
PaymentService

↓

depends on

↓

PaymentRepository
```

Later, this becomes an edge in the dependency graph.

---

# Information Extracted by Aegis

Using JavaParser, Aegis extracts:

## Package Information

Example:

```java
package com.example.payment;
```

---

## Class Names

Example:

```java
public class PaymentService
```

---

## Interfaces

Example:

```java
public interface PaymentGateway
```

---

## Methods

Example:

```java
public void processPayment()
```

---

## Fields

Example:

```java
private UserRepository repository;
```

---

## Annotations

Example:

```java
@Service

@RestController

@Repository
```

These annotations are especially important because Aegis understands Spring Boot applications.

---

## Inheritance

Example:

```java
class AdminService extends UserService
```

---

## Interface Implementation

Example:

```java
class PaymentService implements PaymentGateway
```

---

## Imports

Example:

```java
import org.springframework.stereotype.Service;
```

---

# Visiting the AST

One of the most common ways to analyze an AST is by using the **Visitor Pattern**.

Instead of manually checking every node, we create a visitor that walks through the entire tree.

Conceptually, it looks like this:

```
AST

↓

Visit Package

↓

Visit Class

↓

Visit Field

↓

Visit Method

↓

Visit Annotation
```

Whenever Aegis encounters a node that it is interested in, it extracts the required information.

---

# Why Use the Visitor Pattern?

The Visitor Pattern provides several advantages.

- Cleaner code
- Easier maintenance
- Easy to add support for new node types
- Better separation between parsing and analysis

As Aegis grows, this approach will make it easier to support additional Java language features.

---

# Why Not Parse the Code Myself?

Writing a Java parser from scratch is a very large project.

A complete parser must understand:

- Java grammar
- Keywords
- Operators
- Expressions
- Generics
- Annotations
- Nested classes
- Lambdas
- Records
- Enums

This is exactly what JavaParser already provides.

Instead of spending months building a parser, I chose to use a mature library and focus on solving the actual problem:

**Impact Analysis.**

---

# Limitations

Although JavaParser is powerful, it has some limitations.

It only understands the source code.

It cannot determine:

- Runtime values
- Reflection-generated dependencies
- Dependency Injection at runtime
- Dynamic proxies
- Application state

For this reason, Aegis performs **static dependency analysis**, not runtime analysis.

---

# Summary

JavaParser is responsible for converting Java source code into an Abstract Syntax Tree.

Aegis then traverses the AST to extract project information such as classes, methods, annotations, and dependencies.

The extracted information is later converted into a dependency graph, which becomes the foundation for impact prediction.

JavaParser provides the structured representation, while Aegis performs the actual analysis.

---

# Frequently Asked Interview Questions

## 1. What is JavaParser?

JavaParser is an open-source Java library that parses Java source code and generates an Abstract Syntax Tree (AST).

---

## 2. Why did you choose JavaParser?

Because it is lightweight, well documented, easy to integrate, and provides everything needed to build a static analysis tool.

It allowed me to focus on dependency analysis instead of implementing a Java parser.

---

## 3. Does JavaParser execute the application?

No.

It only reads and parses the source code.

---

## 4. What information do you extract from the AST?

I extract:

- Packages
- Classes
- Interfaces
- Methods
- Fields
- Imports
- Annotations
- Inheritance
- Interface implementations

These are later used to build the dependency graph.

---

## 5. What design pattern is commonly used while traversing an AST?

The Visitor Pattern.

It allows us to visit different node types without changing the structure of the AST.

---

# Quick Revision

✅ JavaParser converts Java source code into an AST.

✅ It does not perform impact analysis.

✅ Aegis traverses the AST to extract project information.

✅ The Visitor Pattern is commonly used to walk through the AST.

✅ The extracted information is converted into a dependency graph.




---

# Dependency Graph

## Introduction

The Dependency Graph is the most important data structure used in Aegis.

After Aegis parses the Java source code and extracts useful information from the Abstract Syntax Tree (AST), it needs a way to represent the relationships between different components of the project.

Instead of storing these relationships as plain lists, Aegis represents the entire project as a graph.

This graph becomes the foundation for:

- Impact Prediction
- Risk Score Calculation
- Dependency Analysis
- Future Architecture Analysis
- Future Dead Code Detection

Almost every major analysis performed by Aegis starts with the Dependency Graph.

---

# What is a Dependency?

A dependency exists when one component relies on another component to perform its work.

For example,

```java
@Service
public class PaymentService {

    private PaymentRepository repository;

}
```

In this example,

`PaymentService` depends on `PaymentRepository`.

Without the repository, the service cannot access the database.

This relationship is called a dependency.

---

# What is a Dependency Graph?

A Dependency Graph is a directed graph that represents the relationships between software components.

Each component is represented as a **Node**.

Each dependency is represented as an **Edge**.

For example,

```
PaymentController

        │

        ▼

PaymentService

        │

        ▼

PaymentRepository
```

This graph immediately tells us:

- Controller depends on Service
- Service depends on Repository

---

# Why Use a Graph?

Initially, I considered storing dependencies inside arrays or lists.

However, as the project grows, this approach becomes difficult to manage.

A graph is a much better choice because software projects naturally form networks of connected components.

Graphs make it easy to answer questions such as:

- Which classes depend on this class?
- What will be affected if this class changes?
- Which component has the highest number of dependencies?
- Is there a circular dependency?
- Which modules are isolated?

These questions are difficult to answer efficiently without a graph.

---

# Graph Terminology

Before understanding how Aegis works, it is important to understand a few graph concepts.

---

## Node

A node represents a software component.

Examples include:

- Class
- Interface
- Controller
- Service
- Repository

Example:

```
PaymentService
```

is one node.

---

## Edge

An edge represents a relationship between two nodes.

Example:

```
PaymentService

↓

PaymentRepository
```

The edge tells us that PaymentService depends on PaymentRepository.

---

## Directed Graph

Aegis uses a **Directed Graph**.

This means every relationship has a direction.

Example:

```
PaymentService

↓

PaymentRepository
```

does **not** mean

```
PaymentRepository

↓

PaymentService
```

Direction is important because dependency relationships are not always two-way.

---

# How Aegis Builds the Dependency Graph

After JavaParser generates the AST, Aegis creates a Project Model.

The Project Model contains information such as:

- Classes
- Interfaces
- Methods
- Fields
- Imports
- Annotations

Using this information, Aegis starts creating graph nodes.

Example:

```
UserController

UserService

UserRepository
```

become three nodes.

Next, Aegis analyzes their relationships.

If UserController uses UserService,

an edge is created.

```
UserController

↓

UserService
```

If UserService uses UserRepository,

another edge is created.

```
UserService

↓

UserRepository
```

Eventually, the entire project becomes a connected graph.

---

# Example Dependency Graph

Imagine a simple Spring Boot project.

```
ProductController

↓

ProductService

↓

ProductRepository

↓

Database
```

Now suppose another service also uses the repository.

```
InventoryService

↓

ProductRepository
```

The graph now looks like this.

```
ProductController
        │
        ▼
ProductService
        │
        ▼
ProductRepository
       ▲
       │
InventoryService
```

This immediately shows that changing ProductRepository may affect more than one service.

---

# Why Is This Useful?

Suppose a developer modifies:

```
ProductRepository
```

Without a graph,

the developer has to manually search the project.

With the Dependency Graph,

Aegis immediately knows:

- ProductService depends on it.
- InventoryService depends on it.
- ProductController indirectly depends on it.

This information is later used during impact analysis.

---

# Types of Dependencies

Aegis can identify different types of dependencies.

Examples include:

### Class Dependency

```
OrderService

↓

PaymentService
```

---

### Interface Dependency

```
PaymentService

↓

PaymentGateway
```

---

### Inheritance

```
AdminService

↓

UserService
```

Meaning:

AdminService extends UserService.

---

### Spring Dependency Injection

```
OrderService

↓

OrderRepository
```

Detected using constructor injection or field injection.

---

# Why Not Store Dependencies in a Database?

The Dependency Graph is held in memory because:

- Graph traversal is fast.
- Relationships are constantly queried.
- No complex database queries are required.
- The graph is temporary and rebuilt when the project is analyzed.

For the current version of Aegis, an in-memory graph provides better performance and simpler implementation.

---

# Advantages of Using a Graph

Using a graph provides many benefits.

- Fast traversal
- Easy relationship analysis
- Easy visualization
- Efficient impact prediction
- Supports graph algorithms
- Scales well for large projects

---

# Limitations

The Dependency Graph is built using static analysis.

Therefore,

it cannot always detect:

- Reflection-based dependencies
- Runtime-generated objects
- Dynamic proxies
- Runtime dependency injection

These limitations are expected because the application is never executed.

---

# How the Dependency Graph Is Used

The Dependency Graph is not the final output.

Instead, it becomes the input for several analysis modules.

```
Dependency Graph

↓

Impact Analyzer

↓

Risk Analyzer

↓

Future Architecture Analyzer

↓

Future Dead Code Analyzer
```

This makes the graph the central data structure of the entire system.

---

# Summary

The Dependency Graph is the core data structure used by Aegis.

It represents software components as nodes and their relationships as directed edges.

Instead of manually exploring project dependencies, Aegis builds this graph automatically using information extracted from the AST.

Almost every feature of Aegis—including impact prediction and risk estimation—depends on this graph.

---

# Frequently Asked Interview Questions

## 1. Why did you use a graph instead of a list?

A graph naturally represents relationships between software components. It allows efficient traversal, dependency analysis, and impact prediction, which would be much harder with simple lists.

---

## 2. Why is the graph directed?

Because dependencies have direction.

If `OrderService` depends on `OrderRepository`, it does not mean the repository depends on the service.

---

## 3. What does a node represent?

A node represents a software component such as a class, interface, controller, service, or repository.

---

## 4. What does an edge represent?

An edge represents a dependency or relationship between two software components.

---

## 5. Why is the Dependency Graph important in Aegis?

It is the foundation of the project. Impact analysis, risk scoring, and future analysis modules all operate on the Dependency Graph.

---

# Quick Revision

✅ Software components become graph nodes.

✅ Dependencies become directed edges.

✅ The graph is built from the Project Model.

✅ The graph is the foundation for impact prediction.

✅ Aegis performs graph traversal instead of manually searching files.

---

> 💡 **Interview Tip**

If an interviewer asks:

**"What is the heart of your project?"**

A strong answer is:

> "The Dependency Graph is the heart of Aegis. Everything before it—parsing Java code, generating the AST, and building the Project Model—is preparation. Everything after it—impact analysis, risk scoring, and future analyzers—depends on traversing this graph. That's why I consider it the core data structure of the project."



---

# Graph Algorithms

## Introduction

After building the Dependency Graph, Aegis needs to answer important questions such as:

- What components are affected if I modify a class?
- Which components depend on this service?
- How many classes are connected?
- Is this class highly coupled with the rest of the application?

A graph by itself is only a collection of nodes and edges.

To answer these questions, Aegis uses **graph traversal algorithms**.

These algorithms help Aegis move through the dependency graph and discover relationships between different software components.

---

# Why Are Graph Algorithms Needed?

Suppose we have the following dependency graph.

```text
UserController
       │
       ▼
UserService
       │
       ▼
UserRepository
```

Now imagine a developer modifies:

```
UserRepository
```

How can Aegis determine what may be affected?

It needs to travel through the graph and discover every connected component.

This is exactly what graph algorithms are designed to do.

---

# Graph Traversal

Graph traversal means visiting the nodes of a graph in a systematic way.

There are two main traversal algorithms.

- Depth First Search (DFS)
- Breadth First Search (BFS)

Both algorithms visit nodes differently.

---

# Depth First Search (DFS)

## What is DFS?

Depth First Search explores one path completely before moving to another path.

Think of it as exploring a maze.

Whenever you find a path, you continue walking until you reach the end.

Only then do you return and explore another path.

---

## Example

```text
A

│

▼

B

│

▼

C

│

▼

D
```

DFS visits:

```
A

↓

B

↓

C

↓

D
```

---

## How Aegis Uses DFS

DFS is useful when Aegis wants to find every dependency connected to a selected component.

For example,

Suppose the developer selects

```
PaymentService
```

DFS continues exploring until every reachable dependency has been visited.

This helps generate a complete impact report.

---

# Breadth First Search (BFS)

## What is BFS?

Breadth First Search explores the graph level by level.

Instead of going deep immediately, it first visits all immediate neighbours.

---

## Example

```text
        A

      /   \

     B     C

    / \     \

   D   E     F
```

BFS visits:

```
A

↓

B

↓

C

↓

D

↓

E

↓

F
```

---

## How Aegis Uses BFS

BFS becomes useful when we want to understand how close components are.

For example,

```
PaymentService

↓

OrderService

↓

OrderController
```

BFS can identify immediate dependencies first before moving to indirect dependencies.

This is useful when presenting impact levels to the developer.

---

# DFS vs BFS

| DFS | BFS |
|------|------|
| Goes deep first | Explores level by level |
| Uses Stack (or recursion) | Uses Queue |
| Good for dependency exploration | Good for shortest-level exploration |
| Lower memory in many cases | Can use more memory |

Both algorithms have their own advantages.

For the current version of Aegis, DFS is expected to be used more frequently for impact analysis.

---

# How Aegis Uses Graph Algorithms

The complete workflow is:

```text
Java Source Code

↓

AST

↓

Project Model

↓

Dependency Graph

↓

DFS / BFS

↓

Affected Components

↓

Impact Report
```

Notice that the algorithms never read Java files directly.

They only work on the Dependency Graph.

---

# Time Complexity

One reason graphs are powerful is because traversal is efficient.

For both DFS and BFS,

Time Complexity:

```
O(V + E)
```

Where

V = Number of Nodes

E = Number of Edges

This means every node and every edge is visited at most once.

For large software projects, this is efficient and scalable.

---

# Example

Suppose the project contains

```text
OrderController

↓

OrderService

↓

PaymentService

↓

PaymentRepository
```

The developer wants to modify

```
PaymentService
```

DFS begins at

```
PaymentService
```

and discovers

```
PaymentRepository
```

Then it checks whether any other components are connected.

The final result becomes

```
Affected Components

• PaymentRepository

• OrderService

• OrderController
```

This information is then passed to the Impact Analyzer.

---

# Why Not Use Nested Loops?

One possible solution is checking every class against every other class.

However,

if the project contains

1000 classes,

this approach becomes very inefficient.

Graph traversal is much faster because it only visits connected nodes.

This makes the algorithm suitable for large enterprise projects.

---

# Future Algorithms

As Aegis grows, additional graph algorithms can be added.

Examples include:

### Cycle Detection

Detect circular dependencies.

Example:

```
A

↓

B

↓

C

↓

A
```

---

### Strongly Connected Components (SCC)

Identify tightly connected modules.

Useful for architecture analysis.

---

### Shortest Path

Find the shortest dependency path between two classes.

Example:

```
Controller

↓

Service

↓

Repository
```

---

### Topological Sorting

Useful for understanding dependency order in projects without cycles.

---

### Centrality Analysis

Identify the most important classes in a project based on how many other components depend on them.

This can help identify critical classes that require careful testing.

---

# Why Graph Algorithms?

I chose graph algorithms because software projects naturally form graphs.

Classes depend on other classes.

Services depend on repositories.

Controllers depend on services.

Representing these relationships as a graph allows efficient analysis and makes future features easier to implement.

---

# Summary

The Dependency Graph stores the relationships between software components.

Graph algorithms allow Aegis to explore these relationships.

DFS and BFS help identify affected components, understand dependencies, and generate impact reports.

As the project evolves, additional algorithms such as Cycle Detection and Strongly Connected Components can provide deeper architectural insights.

---

# Frequently Asked Interview Questions

## 1. Why did you choose a graph?

Because software components naturally form dependency relationships, which are best represented as a graph.

---

## 2. Why is DFS used in Aegis?

DFS efficiently explores all connected dependencies starting from a selected component, making it suitable for impact analysis.

---

## 3. When would BFS be useful?

BFS is useful when exploring dependencies level by level or measuring how close components are within the dependency graph.

---

## 4. What is the time complexity of DFS?

The time complexity is:

O(V + E)

where V is the number of vertices (nodes) and E is the number of edges.

---

## 5. Why not use nested loops?

Nested loops become inefficient as the project grows.

Graph traversal visits only connected nodes, making it much more scalable.

---

# Quick Revision

✅ Software dependencies are represented as a graph.

✅ DFS explores one path completely before backtracking.

✅ BFS explores the graph level by level.

✅ Aegis primarily uses DFS for impact analysis.

✅ Graph traversal has a time complexity of O(V + E).

✅ Future versions of Aegis can use algorithms like Cycle Detection, SCC, and Topological Sort.

---

> 💡 Interview Tip

If an interviewer asks:

**"Which algorithm is the most important in Aegis?"**

A good answer is:

> "The Dependency Graph is the core data structure, and Depth First Search (DFS) is the primary traversal algorithm for the current version. Once a developer selects a class, DFS explores all reachable dependencies to estimate which components may be affected by a change. As Aegis evolves, additional algorithms like cycle detection and strongly connected components will provide deeper architectural insights."



---

# Impact Prediction

## Introduction

Impact Prediction is the primary feature of Aegis.

The main purpose of Aegis is not just to visualize dependencies, but to help developers understand what might be affected before they modify a piece of code.

Whenever a developer changes a class, method, or service, there is always a possibility that other parts of the application may also be affected.

Aegis estimates this impact by analyzing the dependency graph built from the project's source code.

It is important to understand that Aegis does **not predict runtime failures**.

Instead, it estimates the **potential impact** of a code change based on the static relationships found in the source code.

---

# What is Impact Prediction?

Impact Prediction is the process of identifying which software components may be affected when a developer modifies a particular component.

For example,

Suppose a developer changes:

```
PaymentService
```

The developer naturally wants answers to questions like:

- Which classes depend on this service?
- Which APIs might be affected?
- Which modules use this service?
- Which tests should I run?
- Is this a low-risk or high-risk change?

Instead of manually exploring the project, Aegis automatically analyzes the dependency graph and generates an impact report.

---

# Why is Impact Prediction Important?

Large enterprise applications are highly interconnected.

A small modification can affect many other components.

For example,

```
OrderController

↓

OrderService

↓

PaymentService

↓

PaymentRepository
```

If `PaymentService` changes,

there is a possibility that:

- OrderService may be affected.
- OrderController may indirectly be affected.
- PaymentRepository interactions should be reviewed.

Without a tool like Aegis, developers usually discover these relationships manually.

---

# How Aegis Predicts Impact

The impact prediction process follows several steps.

```
Developer selects a class

↓

Aegis locates the node in the Dependency Graph

↓

Graph Traversal begins

↓

Connected components are discovered

↓

Affected components are collected

↓

Risk Score is calculated

↓

Impact Report is generated
```

Each step is explained below.

---

# Step 1 — Developer Selects a Component

The process begins when the developer selects a Java class.

Example:

```
PaymentService.java
```

The selected class becomes the **starting point** of the analysis.

---

# Step 2 — Locate the Graph Node

Every class in the project already exists as a node inside the Dependency Graph.

Example:

```
PaymentService
```

↓

Find corresponding node.

If the node does not exist,

the analysis cannot continue.

---

# Step 3 — Traverse the Graph

Once the node is found,

Aegis starts traversing the graph.

The traversal follows dependency relationships to identify connected components.

For example,

```
OrderController

↓

OrderService

↓

PaymentService

↓

PaymentRepository
```

If the selected class is

```
PaymentService
```

Aegis explores the graph to understand both direct and indirect relationships.

---

# Step 4 — Identify Affected Components

After traversal,

Aegis creates a list of components that may require attention.

Example:

```
Affected Components

• OrderService

• OrderController

• PaymentRepository
```

These components are not guaranteed to break.

Instead,

they are identified because they are connected to the modified component.

---

# Step 5 — Calculate the Risk Score

Once the affected components are known,

Aegis calculates a risk score.

The score estimates how influential the selected component is within the project.

The exact scoring algorithm is explained in the next chapter.

---

# Step 6 — Generate the Impact Report

Finally,

Aegis generates a report.

Example:

```
Impact Report

Selected Component

PaymentService

Affected Components

• OrderService

• OrderController

• PaymentRepository

Risk

High
```

The developer can then make a more informed decision before modifying the code.

---

# Direct vs Indirect Impact

One important concept in Aegis is the difference between direct and indirect impact.

## Direct Impact

A direct impact occurs when one component directly depends on another.

Example:

```
OrderService

↓

PaymentService
```

Here,

OrderService has a direct dependency on PaymentService.

---

## Indirect Impact

An indirect impact occurs through multiple dependency levels.

Example:

```
OrderController

↓

OrderService

↓

PaymentService
```

OrderController does not directly use PaymentService.

However,

it may still be affected because it depends on OrderService.

Understanding indirect dependencies is one of the main reasons for building the dependency graph.

---

# Example Scenario

Suppose the project contains the following components.

```
UserController

↓

UserService

↓

AuthenticationService

↓

UserRepository
```

A developer modifies

```
AuthenticationService
```

Aegis identifies:

```
Directly Connected

• UserRepository

Indirectly Connected

• UserService

• UserController
```

The generated report helps the developer understand which parts of the application should be reviewed or tested.

---

# What Aegis Does NOT Predict

It is important to understand the limitations of impact prediction.

Aegis does not know:

- Whether the application will crash.
- Whether a bug will occur.
- Whether business logic is correct.
- Runtime data.
- Database values.
- User input.

The tool only estimates impact based on source code relationships.

---

# Benefits of Impact Prediction

Impact prediction helps developers:

- Understand unfamiliar codebases.
- Refactor with greater confidence.
- Identify highly connected components.
- Reduce manual code exploration.
- Plan testing more effectively.

It is intended to support developer decision-making, not replace it.

---

# Summary

Impact Prediction is the core feature of Aegis.

By traversing the Dependency Graph, Aegis estimates which components may be affected by a code change.

The analysis is based entirely on static code relationships.

The generated report provides developers with useful insights before they begin refactoring.

---

# Frequently Asked Interview Questions

## 1. What is Impact Prediction?

Impact Prediction is the process of estimating which software components may be affected when a developer modifies a particular component.

---

## 2. Does Aegis guarantee that these components will break?

No.

Aegis estimates the potential impact based on static dependency analysis.

It does not predict runtime failures.

---

## 3. Why is Impact Prediction useful?

It helps developers understand the possible consequences of a change before modifying the code.

This reduces manual exploration and supports safer refactoring.

---

## 4. What information does Aegis use for Impact Prediction?

Aegis uses the Dependency Graph, which is built from the Project Model extracted from the AST.

---

## 5. What is the difference between direct and indirect impact?

Direct impact refers to components that directly depend on the selected component.

Indirect impact refers to components connected through one or more intermediate dependencies.

---

# Quick Revision

✅ Impact Prediction is the main feature of Aegis.

✅ It is based on the Dependency Graph.

✅ Graph traversal identifies affected components.

✅ Aegis estimates impact; it does not guarantee failures.

✅ The output is an Impact Report that helps developers make informed refactoring decisions.

---

> 💡 **Interview Tip**

If an interviewer asks:

**"How does Aegis predict the impact of a code change?"**

A good answer is:

> "After parsing the project and building a dependency graph, Aegis locates the selected component in the graph and traverses its relationships to identify connected components. It then generates an impact report showing which classes or modules may be affected. Since the analysis is static, the result is an estimate based on code structure rather than a prediction of runtime behavior."



---

# Risk Score

## Introduction

After identifying the components that may be affected by a code change, Aegis calculates a **Risk Score**.

The purpose of the Risk Score is to help developers understand how significant a code change might be before they start refactoring.

The Risk Score does **not** determine whether the application will fail.

Instead, it estimates how much attention a developer should give to a particular change based on the relationships found during static analysis.

The score acts as a decision-support indicator rather than a guarantee.

---

# Why Do We Need a Risk Score?

Imagine two situations.

### Scenario 1

```
UtilityClass

↓

Logger
```

Only one component depends on this class.

Changing it is probably low risk.

---

### Scenario 2

```
UserController

↓

UserService

↓

AuthenticationService

↓

UserRepository

↓

Database
```

Now suppose AuthenticationService is also used by:

- PaymentService
- NotificationService
- OrderService
- AdminService

Changing AuthenticationService may affect several important modules.

This change deserves more attention.

Aegis highlights this difference by assigning a higher Risk Score.

---

# What Does the Risk Score Represent?

The Risk Score estimates how connected and influential a component is within the project.

Generally,

more dependencies mean a higher chance that a change could influence other parts of the application.

It is important to remember that:

> A higher Risk Score does **not** mean the code is incorrect.

It simply indicates that the component is more connected and should be modified carefully.

---

# How Aegis Calculates the Risk Score

The current version of Aegis uses a simple rule-based approach.

The score is based on several factors.

---

## Factor 1 — Number of Direct Dependencies

Example

```
OrderService

↓

PaymentService
```

If many components directly depend on a class,

its importance increases.

---

## Factor 2 — Number of Indirect Dependencies

Example

```
OrderController

↓

OrderService

↓

PaymentService
```

Although OrderController does not directly depend on PaymentService,

it may still be affected indirectly.

Indirect relationships are also considered.

---

## Factor 3 — Total Reachable Components

After traversing the Dependency Graph,

Aegis counts how many components are reachable from the selected node.

Example

```
PaymentService

↓

PaymentRepository

↓

DatabaseConfig
```

More reachable components generally indicate a broader impact.

---

## Factor 4 — Relationship Types (Future)

Future versions of Aegis may assign different importance to different dependency types.

For example,

```
CALLS

INJECTS

IMPLEMENTS

EXTENDS
```

Some relationships may contribute more to the Risk Score than others.

---

# Example Calculation

Suppose a developer selects

```
PaymentService
```

Aegis finds:

```
Direct Dependencies

4

Indirect Dependencies

9

Total Reachable Components

13
```

The calculated report becomes

```
Risk Score

74 / 100

Risk Level

High
```

The exact numbers are estimates designed to help developers prioritize their review.

---

# Risk Levels

For the first version of Aegis, the Risk Score is divided into four categories.

| Score | Risk Level |
|--------|------------|
| 0–25 | Low |
| 26–50 | Moderate |
| 51–75 | High |
| 76–100 | Critical |

These ranges can be adjusted in future versions based on real-world testing.

---

# Why Not Use AI?

A common question is:

> Why not let AI calculate the Risk Score?

The current version intentionally uses a deterministic algorithm.

This has several advantages:

- Every score is explainable.
- Results are consistent.
- Developers can understand why a score was assigned.
- Easier to debug and validate.

Once the rule-based system is stable, AI can be introduced as an enhancement rather than replacing the existing logic.

---

# Limitations

The Risk Score has some limitations.

It does not consider:

- Business importance of a module
- Test coverage
- Runtime performance
- Database contents
- Production traffic
- User behaviour

The score is based only on static code relationships.

---

# Future Improvements

Future versions of Aegis may improve the Risk Score by including:

- Git commit history
- Code churn
- Cyclomatic complexity
- Number of developers modifying the file
- Test coverage
- Historical bug frequency
- AI-assisted recommendations

These additions could make the score more representative of real-world software maintenance.

---

# Summary

The Risk Score is designed to help developers estimate how carefully they should approach a code change.

It is calculated using information from the Dependency Graph and reflects how connected a component is within the application.

Rather than predicting failures, it provides a simple and explainable estimate that supports safer refactoring decisions.

---

# Frequently Asked Interview Questions

## 1. What is the purpose of the Risk Score?

The Risk Score helps estimate how much impact a code change may have based on the component's dependencies.

---

## 2. Does a High Risk Score mean the application will fail?

No.

It only means the component has many relationships and should be reviewed more carefully.

---

## 3. How is the Risk Score calculated?

The current implementation considers:

- Direct dependencies
- Indirect dependencies
- Total reachable components

Future versions will include additional factors such as complexity and Git history.

---

## 4. Why didn't you use AI?

I wanted the first version to produce transparent and explainable results.

A deterministic algorithm is easier to understand, validate, and improve.

---

## 5. Can the Risk Score be improved?

Yes.

Future versions can include software metrics, historical project data, and AI-assisted analysis.

---

# Quick Revision

✅ The Risk Score estimates impact, not failures.

✅ It is calculated using dependency relationships.

✅ More connected components generally result in a higher score.

✅ The algorithm is deterministic and explainable.

✅ Future versions can incorporate additional software engineering metrics.

---

> 💡 **Interview Tip**

If an interviewer asks:

**"How did you calculate the Risk Score?"**

A good answer is:

> "The current version uses a rule-based algorithm. After traversing the dependency graph, Aegis considers factors such as the number of direct dependencies, indirect dependencies, and total reachable components. These values are combined to estimate how connected a component is. I chose this approach because every score is explainable and easy to validate. In future versions, I plan to include additional metrics like code complexity, Git history, and test coverage."



---

# VS Code Extension Architecture

## Introduction

Aegis consists of two independent applications:

1. The VS Code Extension
2. The Analyzer Engine

The VS Code extension is responsible for interacting with the developer, while the Analyzer Engine is responsible for analyzing the source code.

This separation keeps the project modular and allows the analyzer to be reused in the future.

---

# Why Build a VS Code Extension?

Instead of building a separate desktop application, I wanted Aegis to work directly inside the developer's IDE.

Developers spend most of their time writing code inside Visual Studio Code.

Keeping the analysis inside the IDE means developers do not need to switch between multiple applications.

This provides a smoother and more productive workflow.

---

# Responsibilities of the VS Code Extension

The extension is responsible for:

- Detecting the currently opened project.
- Registering Aegis commands.
- Starting the Analyzer Engine.
- Sending the project path to the analyzer.
- Receiving analysis results.
- Displaying reports.
- Displaying dependency graphs.
- Showing notifications and errors.

Notice that the extension **does not perform any code analysis itself**.

Its primary job is to coordinate communication between the developer and the analyzer.

---

# High-Level Workflow

The interaction between the developer, the extension, and the analyzer follows this workflow.

```text
Developer

↓

Clicks "Analyze Project"

↓

VS Code Extension

↓

Starts Analyzer Engine

↓

Analyzer Reads Project

↓

Analyzer Generates Report

↓

JSON Response

↓

VS Code Extension

↓

Display Results
```

---

# Extension Lifecycle

A VS Code extension follows a lifecycle.

## Step 1 – Installation

The developer installs the Aegis extension.

VS Code registers the extension using the `package.json` file.

---

## Step 2 – Activation

The extension becomes active when a predefined event occurs.

Examples include:

- Opening a Java project
- Running an Aegis command
- Clicking an Aegis menu option

When activated, VS Code executes the extension's entry point.

---

## Step 3 – Register Commands

During activation, Aegis registers commands with VS Code.

Examples:

- Analyze Project
- Analyze Current Class
- Show Dependency Graph
- Generate Impact Report

These commands become available through the Command Palette or context menus.

---

## Step 4 – Start the Analyzer

When the user starts an analysis, the extension launches the Java Analyzer Engine.

The extension sends the project path so that the analyzer knows which project to inspect.

Example:

```text
Project Path

↓

/Users/sumit/projects/sample-project
```

---

## Step 5 – Wait for Results

The extension waits while the analyzer performs:

- Parsing
- AST generation
- Dependency graph creation
- Impact analysis
- Risk calculation

The extension itself remains responsible only for the user interface.

---

## Step 6 – Display Results

After the analysis is complete, the extension receives a JSON response.

The results are displayed inside VS Code using a Webview.

Examples include:

- Dependency Graph
- Impact Report
- Risk Score
- Summary Statistics

---

# Communication Between TypeScript and Java

One interesting aspect of Aegis is that it uses two different programming languages.

The extension is written in TypeScript.

The analyzer is written in Java.

To allow them to work together, they exchange information using JSON.

The communication looks like this:

```text
VS Code Extension (TypeScript)

↓

JSON Request

↓

Analyzer Engine (Java)

↓

JSON Response

↓

VS Code Extension
```

Because JSON is language-independent, both applications can easily understand the exchanged data.

---

# Why Use JSON?

JSON was selected because it is:

- Lightweight
- Human-readable
- Easy to parse
- Language-independent
- Widely supported

Using JSON also makes it easier to replace the communication mechanism in the future, such as moving from a local process to a REST API.

---

# Webview

A standard VS Code notification is not suitable for displaying complex information like dependency graphs.

For this reason, Aegis uses a Webview.

A Webview is a small embedded browser inside VS Code.

It allows developers to build rich user interfaces using HTML, CSS, and JavaScript (or React).

The Webview is responsible for displaying:

- Dependency Graph
- Impact Report
- Risk Score
- Future dashboards

---

# Why Separate the UI and Analyzer?

Separating the UI from the analyzer has several advantages.

## Better Maintainability

The analyzer can evolve without changing the extension.

---

## Better Reusability

The same analyzer can later be used in:

- IntelliJ IDEA
- Eclipse
- Command Line Interface (CLI)
- REST API
- Cloud Service

---

## Better Testing

The analyzer can be tested independently from the user interface.

---

## Better Scalability

As Aegis grows, additional analysis modules can be added without redesigning the extension.

---

# Current Limitations

The current implementation has some limitations.

- Supports only Java Spring Boot projects.
- Runs analysis on demand.
- Does not yet support background analysis.
- Does not yet support incremental analysis.

These improvements are planned for future versions.

---

# Future Improvements

Future versions of the extension may include:

- Real-time analysis while typing.
- Automatic project indexing.
- CodeLens integration.
- Diagnostic warnings.
- Sidebar dashboard.
- Multiple project support.
- AI-powered explanations.

---

# Summary

The VS Code extension acts as the user interface of Aegis.

Its responsibility is to receive user requests, communicate with the Analyzer Engine, and present the analysis results inside Visual Studio Code.

The separation between the extension and the analyzer keeps the project modular, reusable, and easier to maintain.

---

# Frequently Asked Interview Questions

## 1. Why did you build a VS Code extension instead of a web application?

Because Aegis is a developer tool. Developers work inside their IDE, so integrating directly into VS Code provides a better experience than requiring a separate application.

---

## 2. Does the extension perform code analysis?

No.

The extension only manages user interaction.

All code analysis is performed by the Java Analyzer Engine.

---

## 3. How do the extension and analyzer communicate?

They communicate by exchanging JSON data.

The extension sends project information, and the analyzer returns structured analysis results.

---

## 4. Why use a Webview?

A Webview allows Aegis to display rich and interactive interfaces such as dependency graphs and detailed reports, which cannot be achieved using simple VS Code notifications.

---

## 5. Can the analyzer be reused outside VS Code?

Yes.

The analyzer is independent of the extension, so it can later be integrated into other IDEs, a CLI application, or exposed through a REST API.

---

# Quick Revision

✅ The extension is responsible for the user interface.

✅ The analyzer performs all code analysis.

✅ Communication happens through JSON.

✅ Results are displayed inside a Webview.

✅ The modular architecture makes the analyzer reusable in other environments.

---

> 💡 **Interview Tip**

If an interviewer asks:

**"Why didn't you build everything inside the extension?"**

A good answer is:

> "I wanted to separate the presentation layer from the analysis layer. The VS Code extension handles user interaction, while the analyzer focuses entirely on parsing, graph generation, and impact analysis. This makes the analyzer reusable in other environments, such as an IntelliJ plugin or a CLI tool, without changing its core logic."



---

# Software Design Principles & Design Patterns

## Introduction

While developing Aegis, I wanted the project to be modular, maintainable, and easy to extend.

Instead of putting all the logic into one large class, I divided the project into smaller components where each component has a clear responsibility.

This approach makes the project easier to understand, easier to test, and easier to modify in the future.

Although Aegis is still under development, its architecture has been designed with software engineering best practices in mind.

---

# SOLID Principles

The architecture of Aegis follows several SOLID principles.

These principles help build software that is easier to maintain and extend.

---

## 1. Single Responsibility Principle (SRP)

### Definition

A class should have only one reason to change.

In simple words,

every class should perform one specific job.

---

### How Aegis Uses SRP

Instead of creating one large class that performs every task, Aegis separates responsibilities.

Examples:

| Class | Responsibility |
|---------|----------------|
| JavaParserClient | Parse Java source code |
| DependencyGraphBuilder | Build the dependency graph |
| ImpactAnalyzer | Analyze project impact |
| RiskScorer | Calculate the risk score |
| Extension.ts | Handle VS Code interactions |

Each class focuses on one responsibility.

This makes debugging and maintenance much easier.

---

## 2. Open/Closed Principle (OCP)

### Definition

Software should be open for extension but closed for modification.

Instead of changing existing code, new functionality should be added by extending the system.

---

### How Aegis Uses OCP

The analyzer is designed so that future analysis modules can be added.

Examples include:

- Security Analyzer
- Complexity Analyzer
- Dead Code Analyzer
- Architecture Analyzer

These new analyzers can be added without rewriting the parser or graph builder.

---

## 3. Liskov Substitution Principle (LSP)

The current version of Aegis does not make heavy use of inheritance.

However, future analyzer modules can inherit from a common interface or abstract class while preserving expected behavior.

---

## 4. Interface Segregation Principle (ISP)

Instead of one large interface containing many unrelated methods, smaller focused interfaces are preferred.

Example:

Instead of:

```
Analyzer
```

containing every possible method,

future versions may define:

```
ImpactAnalyzer

RiskAnalyzer

SecurityAnalyzer
```

Each module only implements the methods it actually needs.

---

## 5. Dependency Inversion Principle (DIP)

High-level modules should depend on abstractions instead of concrete implementations.

For example,

instead of directly depending on JavaParser,

future versions can depend on a parser interface.

```
Parser

↓

JavaParser

KotlinParser

PythonParser
```

This makes it easier to support additional programming languages.

---

# Design Patterns

Aegis either uses or is designed to support the following design patterns.

---

# 1. Builder Pattern

The Dependency Graph is gradually constructed as the project is analyzed.

Instead of creating the graph all at once, nodes and relationships are added step by step.

This follows the idea of the Builder Pattern.

```
Read Class

↓

Create Node

↓

Find Dependencies

↓

Create Edges

↓

Repeat

↓

Dependency Graph Complete
```

---

# 2. Strategy Pattern (Recommended)

Different analysis tasks may require different graph traversal algorithms.

Examples:

- DFS Strategy
- BFS Strategy
- Reverse Traversal Strategy

Instead of writing one large traversal method, each algorithm can be implemented independently.

This makes the system easier to extend.

---

# 3. Visitor Pattern

JavaParser commonly uses the Visitor Pattern to traverse the Abstract Syntax Tree.

Instead of manually checking every node, a visitor walks through the tree and performs actions for each node type.

For Aegis, this allows easy extraction of:

- Classes
- Methods
- Fields
- Annotations
- Imports

---

# 4. Facade Pattern

The VS Code extension does not directly interact with every internal module.

Instead,

it communicates only with the Analyzer Engine.

The Analyzer Engine coordinates:

- Parsing
- Graph Building
- Impact Analysis
- Risk Calculation

This provides a simple interface for the extension.

---

# 5. Model Pattern

Aegis introduces a Project Model between the AST and the Dependency Graph.

```
Java Source Code

↓

JavaParser

↓

AST

↓

Project Model

↓

Dependency Graph
```

The Project Model separates parsing logic from graph generation.

This makes the analyzer independent of JavaParser.

If JavaParser is replaced in the future, the rest of the system remains unchanged.

---

# Why Is This Architecture Important?

As Aegis grows,

new features should not require rewriting existing modules.

For example,

suppose I later want to add:

- AI Code Explanation
- Dead Code Detection
- Security Analysis

These features should use the existing Project Model and Dependency Graph instead of rebuilding the analysis process.

This reduces duplication and keeps the project maintainable.

---

# Design Decisions

While developing Aegis, I made several architectural decisions.

### Separate the VS Code Extension and Analyzer

Reason:

To make the analyzer reusable in IntelliJ, CLI tools, or future cloud services.

---

### Introduce a Project Model

Reason:

To avoid coupling the graph directly to JavaParser.

---

### Use a Dependency Graph

Reason:

Software components naturally form a graph, making graph algorithms suitable for analysis.

---

### Use JSON for Communication

Reason:

JSON is lightweight, language-independent, and easy to parse.

---

### Keep the Analyzer Modular

Reason:

Future analysis modules should be added without changing the existing architecture.

---

# Summary

The architecture of Aegis is based on modular design rather than a single monolithic implementation.

By applying software engineering principles such as Single Responsibility and using patterns like Visitor, Strategy, and Facade, the project becomes easier to maintain, easier to extend, and better suited for future growth.

Although the first version focuses on impact analysis, the architecture has been designed to support additional analysis modules with minimal changes.

---

# Frequently Asked Interview Questions

## 1. Which SOLID principle is most visible in Aegis?

The Single Responsibility Principle.

Each module performs one specific task, such as parsing, graph building, or impact analysis.

---

## 2. Why do you use the Visitor Pattern?

The Visitor Pattern allows Aegis to traverse the AST and process different node types without modifying the AST itself.

---

## 3. Why is the Strategy Pattern useful?

Different analysis tasks require different traversal algorithms.

Using the Strategy Pattern allows these algorithms to be exchanged without modifying the analyzer.

---

## 4. Why introduce a Project Model?

The Project Model separates JavaParser from the Dependency Graph.

This reduces coupling and makes the analyzer easier to maintain.

---

## 5. What is the biggest architectural decision in Aegis?

Separating the VS Code extension from the analyzer engine.

This allows the analyzer to be reused by different IDEs or applications.

---

# Quick Revision

✅ Each module has one responsibility.

✅ The analyzer is independent of VS Code.

✅ Visitor Pattern is used for AST traversal.

✅ Strategy Pattern is suitable for graph traversal.

✅ The Project Model reduces coupling between JavaParser and the graph.

✅ The architecture is designed for future expansion.


---

# Future Scope

## Introduction

The current version of Aegis focuses on one primary goal:

**Helping developers understand the potential impact of code changes in Java Spring Boot applications using static code analysis.**

Although the current implementation achieves this goal, the architecture has been intentionally designed to support future enhancements without major changes.

Many of the future features will reuse the existing components such as:

- Project Model
- Dependency Graph
- Impact Analysis Engine

This makes Aegis scalable and easier to evolve over time.

---

# 1. Multi-Language Support

The current version supports only Java Spring Boot projects.

In future versions, Aegis can support additional programming languages.

Possible languages include:

- Kotlin
- Python
- C#
- JavaScript
- TypeScript

Each language would require its own parser, but the rest of the analysis pipeline can remain the same.

```
Source Code

↓

Language Parser

↓

Project Model

↓

Dependency Graph

↓

Analysis Engine
```

This is one reason why the Project Model was introduced.

---

# 2. Incremental Analysis

Currently, Aegis analyzes the entire project every time.

This works well for small and medium-sized projects.

However, enterprise applications may contain thousands of source files.

Instead of analyzing everything again, Aegis could analyze only the files that have changed.

Benefits:

- Faster analysis
- Lower CPU usage
- Better developer experience

---

# 3. Background Analysis

Currently, analysis starts only when the developer runs a command.

Future versions can continuously monitor the project.

Whenever a file is saved, Aegis can automatically update the dependency graph in the background.

This would provide near real-time feedback.

---

# 4. Architecture Visualization

The current version focuses mainly on dependency visualization.

Future versions can generate complete architecture diagrams.

Examples include:

- Layer diagrams
- Package dependency diagrams
- Module dependency maps
- Microservice interaction diagrams

This would help developers understand large software systems much more quickly.

---

# 5. Dead Code Detection

Many enterprise projects contain classes and methods that are no longer used.

Aegis can analyze the Dependency Graph to identify components that have no incoming or outgoing relationships.

Developers could then safely remove unused code.

---

# 6. Circular Dependency Detection

Circular dependencies make software difficult to maintain.

Example:

```
Service A

↓

Service B

↓

Service C

↓

Service A
```

Future versions of Aegis can automatically detect these cycles and warn developers.

---

# 7. Software Metrics Dashboard

Aegis can display useful project metrics such as:

- Total Classes
- Total Interfaces
- Total Packages
- Number of Dependencies
- Most Connected Classes
- Largest Modules

This gives developers a quick overview of the project.

---

# 8. Git Integration

Aegis can integrate with Git to provide additional insights.

Examples include:

- Recently modified files
- Frequently changed classes
- Files with many contributors
- Change history

Combining Git history with dependency analysis can improve impact estimation.

---

# 9. Test Recommendation

One practical improvement is recommending which tests should be executed after a code change.

Example:

```
Modified

↓

PaymentService

↓

Affected Components

↓

Recommended Unit Tests

↓

Recommended Integration Tests
```

This can reduce unnecessary testing and save developer time.

---

# 10. AI-Assisted Explanation

Artificial Intelligence should enhance Aegis rather than replace it.

Instead of performing the analysis, AI can explain the analysis in simple language.

Example:

> "Changing PaymentService may affect OrderService because it depends on PaymentService for payment processing."

This makes the reports easier to understand, especially for new developers.

---

# 11. IntelliJ IDEA Plugin

The analyzer is independent of VS Code.

This makes it possible to build plugins for other IDEs.

Possible targets include:

- IntelliJ IDEA
- Eclipse

Only the user interface would change.

The Analyzer Engine can remain the same.

---

# 12. Command Line Interface (CLI)

Future versions can provide a CLI.

Example:

```bash
aegis analyze ./my-project
```

This would allow developers to use Aegis without opening an IDE.

---

# 13. REST API

The analyzer can also be exposed as a REST API.

Example:

```
POST /analyze

↓

Project

↓

JSON Response
```

This would allow:

- CI/CD pipelines
- Internal developer portals
- Other applications

to use Aegis programmatically.

---

# 14. CI/CD Integration

Aegis can become part of the build pipeline.

Before a Pull Request is merged, Aegis can automatically generate:

- Dependency Report
- Impact Report
- Risk Score

This helps reviewers understand the possible consequences of code changes.

---

# 15. Plugin-Based Analyzer

One long-term goal is to make Aegis extensible.

Instead of supporting only Impact Analysis, developers could install additional analyzers.

Examples:

- Impact Analyzer
- Security Analyzer
- Complexity Analyzer
- Dead Code Analyzer
- Architecture Analyzer

Each analyzer would operate on the same Project Model and Dependency Graph.

---

# Long-Term Vision

The long-term goal of Aegis is to become a **Developer Intelligence Platform** rather than just a dependency analysis tool.

Instead of simply displaying relationships, Aegis should help developers understand, maintain, and improve software systems.

The existing modular architecture provides a strong foundation for achieving this vision.

---

# Summary

Although the first version of Aegis focuses on impact analysis for Java Spring Boot projects, its architecture is designed for continuous growth.

Features such as multi-language support, Git integration, architecture visualization, dead code detection, and plugin-based analyzers can all be added without redesigning the core system.

This demonstrates one of the main design goals of Aegis: **build a small but extensible platform rather than a one-time project.**

---

# Frequently Asked Interview Questions

## 1. If you had six more months, what would you build?

I would focus on incremental analysis, Git integration, architecture visualization, and test recommendation because these provide immediate value to developers while reusing the existing architecture.

---

## 2. Can Aegis support other programming languages?

Yes.

The architecture separates parsing from analysis.

By implementing a parser for another language and converting it into the same Project Model, the existing graph and analysis engine can be reused.

---

## 3. Why did you separate the parser from the analyzer?

Because parsing is language-specific, while graph analysis is language-independent.

This makes the system easier to extend to new programming languages.

---

## 4. What feature would you implement first after Version 1?

Incremental analysis.

It would significantly improve performance for large projects by analyzing only modified files instead of the entire codebase.

---

# Quick Revision

✅ Current version focuses on Java Spring Boot.

✅ Future versions can support multiple languages.

✅ Incremental analysis improves performance.

✅ Git integration improves impact estimation.

✅ The analyzer can become a plugin-based platform.

✅ Long-term goal is to build a Developer Intelligence Platform.

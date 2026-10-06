import Lexer from "./Lexer";
import Parser from "./Parser";

const code = `
    func sum(a, b) {
        return a + b;
    }

    func double(x) {
        return x + x;
    }

    result = double(sum(3, 4));
    console result;

    sum2 = sum(sum(1, 2), 10);
    console sum2;
`;

const lexer = new Lexer(code);
lexer.lexAnalysis();

const parser = new Parser(lexer.tokenList);
const rootNode = parser.parseCode();
parser.run(rootNode);